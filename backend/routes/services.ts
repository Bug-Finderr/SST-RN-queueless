import { requireAdmin } from "../middleware/auth";
import { Service } from "../models/service";
import { Token } from "../models/token";
import { badRequest, notFound, parseBody } from "../utils/response";
import { serviceSchema, validate, validateId } from "../utils/validation";

// Get all active services with queue stats (single aggregation query)
export async function handleListServices(): Promise<Response> {
  const services = await Service.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "tokens",
        let: { serviceId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$serviceId", "$$serviceId"] },
              status: { $in: ["waiting", "being_served"] },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              token: { $first: "$$ROOT" },
            },
          },
        ],
        as: "tokenStats",
      },
    },
  ]);

  return Response.json(
    services.map((s) => {
      const beingServed = s.tokenStats.find(
        (t: { _id: string }) => t._id === "being_served",
      );
      const waiting = s.tokenStats.find(
        (t: { _id: string }) => t._id === "waiting",
      );
      return {
        id: s._id.toString(),
        name: s.name,
        description: s.description,
        avgServiceTimeMins: s.avgServiceTimeMins,
        isActive: s.isActive,
        createdAt: s.createdAt,
        currentToken: beingServed?.token?.tokenNumber ?? null,
        waitingCount: waiting?.count ?? 0,
        estimatedWaitMins: (waiting?.count ?? 0) * s.avgServiceTimeMins,
      };
    }),
  );
}

// Create new service (admin only)
export async function handleCreateService(request: Request): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const validation = validate(serviceSchema, body);
  if (!validation.success) return validation.error;

  const service = await Service.create(validation.data);
  return Response.json(service.toJSON(), { status: 201 });
}

// Update service (admin only)
export async function handleUpdateService(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const validation = validate(serviceSchema, body);
  if (!validation.success) return validation.error;

  const service = await Service.findByIdAndUpdate(
    serviceId,
    { $set: validation.data },
    { new: true, runValidators: true },
  );
  if (!service) return notFound("Service not found");

  return Response.json(service.toJSON());
}

// Soft delete service (admin only)
export async function handleDeleteService(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const idError = validateId(serviceId, "Service");
  if (idError) return idError;

  const service = await Service.findByIdAndUpdate(
    serviceId,
    { $set: { isActive: false } },
    { new: true },
  );
  if (!service) return notFound("Service not found");

  return Response.json({ message: "Service deleted successfully" });
}
