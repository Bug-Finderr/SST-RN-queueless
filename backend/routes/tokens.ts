import mongoose from "mongoose";

import { requireAdmin, requireAuth } from "../middleware/auth";
import { Service } from "../models/service";
import { Token } from "../models/token";
import {
  callNextToken,
  completeCurrentToken,
  getEstimatedWaitMins,
  getNextTokenNumber,
  getNotificationMessage,
  getQueuePosition,
  getQueueStatus,
  hasActiveToken,
} from "../services/queue";
import type {
  AuthenticatedUser,
  ITokenDocument,
  PopulatedToken,
} from "../types";
import { badRequest, forbidden, notFound } from "../utils/response";
import { validateId } from "../utils/validation";

// Book a new token
export async function handleBookToken(request: Request): Promise<Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const user = authResult as AuthenticatedUser;

  const serviceId = new URL(request.url).searchParams.get("service_id");
  if (!serviceId) return badRequest("service_id query parameter is required");

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const service = await Service.findOne({
    _id: new mongoose.Types.ObjectId(serviceId),
    isActive: true,
  }).lean();
  if (!service) return notFound("Service not found");

  if (await hasActiveToken(user.id, serviceId)) {
    return badRequest("You already have an active token for this service");
  }

  const tokenNumber = await getNextTokenNumber(serviceId);
  const token = await Token.create({
    tokenNumber,
    userId: new mongoose.Types.ObjectId(user.id),
    serviceId: new mongoose.Types.ObjectId(serviceId),
    status: "waiting",
  });

  const position = await getQueuePosition(token);
  const estimatedWaitMins = await getEstimatedWaitMins(
    token.serviceId,
    position,
  );

  return Response.json(
    {
      id: token._id.toString(),
      tokenNumber: token.tokenNumber,
      status: token.status,
      createdAt: token.createdAt,
      service: { id: service._id.toString(), name: service.name },
      positionInQueue: position,
      estimatedWaitMins,
    },
    { status: 201 },
  );
}

// Get user's tokens
export async function handleGetMyTokens(request: Request): Promise<Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const user = authResult as AuthenticatedUser;

  const tokens = (await Token.find({
    userId: new mongoose.Types.ObjectId(user.id),
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("serviceId", "name description avgServiceTimeMins")
    .lean()) as unknown as PopulatedToken[];

  const tokensWithDetails = await Promise.all(
    tokens.map(async (token) => {
      const position =
        token.status === "waiting"
          ? await getQueuePosition(token as unknown as ITokenDocument)
          : null;
      const estimatedWaitMins = position
        ? await getEstimatedWaitMins(token.serviceId._id, position)
        : null;

      return {
        id: token._id.toString(),
        tokenNumber: token.tokenNumber,
        status: token.status,
        createdAt: token.createdAt,
        calledAt: token.calledAt,
        completedAt: token.completedAt,
        service: {
          id: token.serviceId._id.toString(),
          name: token.serviceId.name,
        },
        positionInQueue: position,
        estimatedWaitMins,
        notification: getNotificationMessage(token.status, position ?? 0),
      };
    }),
  );

  return Response.json(tokensWithDetails);
}

// Get notifications for near-turn tokens
export async function handleGetNotifications(
  request: Request,
): Promise<Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const user = authResult as AuthenticatedUser;

  const tokens = (await Token.find({
    userId: new mongoose.Types.ObjectId(user.id),
    status: { $in: ["waiting", "being_served"] },
  })
    .populate("serviceId", "name")
    .lean()) as unknown as PopulatedToken[];

  const notifications = (
    await Promise.all(
      tokens.map(async (token) => {
        const position =
          token.status === "waiting"
            ? await getQueuePosition(token as unknown as ITokenDocument)
            : 0;
        const message = getNotificationMessage(token.status, position);
        if (!message) return null;
        return {
          tokenId: token._id.toString(),
          tokenNumber: token.tokenNumber,
          serviceName: token.serviceId.name,
          position,
          message,
        };
      }),
    )
  ).filter(Boolean);

  return Response.json(notifications);
}

// Cancel token
export async function handleCancelToken(
  request: Request,
  tokenId: string,
): Promise<Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const user = authResult as AuthenticatedUser;

  const idError = validateId(tokenId, "Token");
  if (idError) return idError;

  const token = await Token.findById(tokenId);
  if (!token) return notFound("Token not found");

  if (token.userId.toString() !== user.id && user.role !== "admin") {
    return forbidden("You can only cancel your own tokens");
  }

  if (!["waiting", "being_served"].includes(token.status)) {
    return badRequest(
      "Token cannot be canceled - it has already been processed",
    );
  }

  token.status = "canceled";
  token.completedAt = new Date();
  await token.save();

  return Response.json({ message: "Token canceled successfully" });
}

// Get queue status for service (public)
export async function handleGetQueueStatus(
  serviceId: string,
): Promise<Response> {
  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const service = await Service.findById(serviceId).lean();
  if (!service) return notFound("Service not found");

  return Response.json(await getQueueStatus(serviceId));
}

// Complete current token (admin only)
export async function handleCompleteToken(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const result = await completeCurrentToken(serviceId);
  return Response.json(
    result.completed
      ? {
          message: `Token #${result.tokenNumber} completed`,
          completed: true,
          tokenNumber: result.tokenNumber,
        }
      : { message: "No token is currently being served", completed: false },
  );
}

// Call next token (admin only)
export async function handleCallNext(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const completedResult = await completeCurrentToken(serviceId);
  const nextResult = await callNextToken(serviceId);

  return Response.json(
    nextResult.called
      ? {
          message: `Now serving token #${nextResult.tokenNumber}`,
          completedPrevious: completedResult.completed,
          nextTokenNumber: nextResult.tokenNumber,
          nextTokenId: nextResult.tokenId,
        }
      : {
          message: "No waiting tokens in queue",
          completedPrevious: completedResult.completed,
          nextTokenNumber: null,
        },
  );
}

// Skip token (admin only)
export async function handleSkipToken(
  request: Request,
  tokenId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(tokenId, "Token");
  if (idError) return idError;

  const token = await Token.findById(tokenId);
  if (!token) return notFound("Token not found");

  if (!["waiting", "being_served"].includes(token.status)) {
    return badRequest(
      "Token cannot be skipped - it has already been processed",
    );
  }

  token.status = "skipped";
  token.completedAt = new Date();
  await token.save();

  return Response.json({
    message: `Token #${token.tokenNumber} skipped`,
    tokenNumber: token.tokenNumber,
  });
}

// Get all tokens for service (admin only)
export async function handleGetServiceTokens(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const tokens = await Token.find({
    serviceId: new mongoose.Types.ObjectId(serviceId),
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return Response.json(
    tokens.map((t) => ({
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      userId: t.userId.toString(),
      status: t.status,
      createdAt: t.createdAt,
      calledAt: t.calledAt,
      completedAt: t.completedAt,
    })),
  );
}
