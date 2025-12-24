import mongoose from "mongoose";

import { config } from "../config";
import { Service } from "../models/service";
import { getTodayStart, Token } from "../models/token";
import type { ITokenDocument, QueueStatus, TokenStatus } from "../types";

// Counter collection for atomic token numbering
// This fixes the race condition in the Python version
const counterSchema = new mongoose.Schema({
  _id: String, // serviceId_date format
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Get next token number atomically
export async function getNextTokenNumber(serviceId: string): Promise<number> {
  const today = getTodayStart();
  const counterId = `${serviceId}_${today.toISOString().split("T")[0]}`;

  const counter = await (
    Counter as mongoose.Model<{ _id: string; seq: number }>
  ).findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return counter?.seq ?? 1;
}

// Calculate position in queue
export async function getQueuePosition(token: ITokenDocument): Promise<number> {
  const count = await Token.countDocuments({
    serviceId: token.serviceId,
    status: "waiting",
    createdAt: { $lt: token.createdAt },
  });

  return count + 1;
}

// Get estimated wait time
export async function getEstimatedWaitMins(
  serviceId: mongoose.Types.ObjectId,
  position: number,
): Promise<number> {
  const service = await Service.findById(serviceId).lean();
  if (!service) return 0;

  // Position 1 means you're next, so wait = 0
  // Position 2 means 1 person ahead, etc.
  return Math.max(0, position - 1) * service.avgServiceTimeMins;
}

// Get notification message if turn is near
export function getNotificationMessage(
  status: TokenStatus,
  position: number,
): string | null {
  if (status === "being_served") {
    return "It's your turn! Please proceed to the counter.";
  }

  if (status === "waiting" && position <= config.notifyWhenPositionNear) {
    if (position === 1) {
      return "You're next! Please prepare to be called.";
    }
    return `Your turn is coming up! You're #${position} in line.`;
  }

  return null;
}

// Check if user has active token for service
export async function hasActiveToken(
  userId: mongoose.Types.ObjectId | string,
  serviceId: mongoose.Types.ObjectId | string,
): Promise<boolean> {
  const activeToken = await Token.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    serviceId: new mongoose.Types.ObjectId(serviceId),
    status: { $in: ["waiting", "being_served"] },
  }).lean();

  return !!activeToken;
}

// Get queue status for a service
export async function getQueueStatus(serviceId: string): Promise<QueueStatus> {
  const serviceObjectId = new mongoose.Types.ObjectId(serviceId);

  const [beingServed, waitingTokens, totalServed] = await Promise.all([
    Token.findOne({
      serviceId: serviceObjectId,
      status: "being_served",
    }).lean(),

    Token.find({
      serviceId: serviceObjectId,
      status: "waiting",
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean(),

    Token.countDocuments({
      serviceId: serviceObjectId,
      status: "completed",
      createdAt: { $gte: getTodayStart() },
    }),
  ]);

  return {
    serviceId,
    currentToken: beingServed?.tokenNumber ?? null,
    beingServedTokenId: beingServed?._id.toString() ?? null,
    waitingTokens: waitingTokens.map((token, index) => ({
      id: token._id.toString(),
      tokenNumber: token.tokenNumber,
      position: index + 1,
    })),
    totalWaiting: waitingTokens.length,
    totalServed,
  };
}

// Complete current token being served
export async function completeCurrentToken(serviceId: string): Promise<{
  completed: boolean;
  tokenNumber?: number;
}> {
  const result = await Token.findOneAndUpdate(
    {
      serviceId: new mongoose.Types.ObjectId(serviceId),
      status: "being_served",
    },
    {
      $set: {
        status: "completed",
        completedAt: new Date(),
      },
    },
    { new: false }, // Return old document to get token number
  );

  return {
    completed: !!result,
    tokenNumber: result?.tokenNumber,
  };
}

// Call next token in queue
export async function callNextToken(serviceId: string): Promise<{
  called: boolean;
  tokenNumber?: number;
  tokenId?: string;
}> {
  const nextToken = await Token.findOneAndUpdate(
    {
      serviceId: new mongoose.Types.ObjectId(serviceId),
      status: "waiting",
    },
    {
      $set: {
        status: "being_served",
        calledAt: new Date(),
      },
    },
    {
      new: true,
      sort: { createdAt: 1 }, // Get oldest waiting token
    },
  );

  return {
    called: !!nextToken,
    tokenNumber: nextToken?.tokenNumber,
    tokenId: nextToken?._id.toString(),
  };
}
