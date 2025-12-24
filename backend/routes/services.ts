import { requireAdmin } from "../middleware/auth";
import { Service } from "../models/service";
import { Token } from "../models/token";
import { badRequest, notFound, parseBody } from "../utils/response";
import { objectIdSchema, serviceSchema, validate } from "../utils/validation";

// Get all active services with queue stats
export async function handleListServices(): Promise<Response> {
  const services = await Service.find({ isActive: true }).lean();

  // Get queue stats for each service
  const servicesWithQueue = await Promise.all(
    services.map(async (service) => {
      const [currentToken, waitingCount] = await Promise.all([
        // Get currently being served token
        Token.findOne({
          serviceId: service._id,
          status: "being_served",
        }).lean(),
        // Count waiting tokens
        Token.countDocuments({
          serviceId: service._id,
          status: "waiting",
        }),
      ]);

      return {
        id: service._id.toString(),
        name: service.name,
        description: service.description,
        avgServiceTimeMins: service.avgServiceTimeMins,
        isActive: service.isActive,
        createdAt: service.createdAt,
        // Queue stats
        currentToken: currentToken?.tokenNumber ?? null,
        waitingCount,
        estimatedWaitMins: waitingCount * service.avgServiceTimeMins,
      };
    }),
  );

  return Response.json(servicesWithQueue);
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

  // Validate ID format
  const idValidation = validate(objectIdSchema, serviceId);
  if (!idValidation.success) return notFound("Service not found");

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const validation = validate(serviceSchema, body);
  if (!validation.success) return validation.error;

  const service = await Service.findByIdAndUpdate(
    serviceId,
    { $set: validation.data },
    { new: true, runValidators: true },
  );

  if (!service) {
    return notFound("Service not found");
  }

  return Response.json(service.toJSON());
}

// Soft delete service (admin only)
export async function handleDeleteService(
  request: Request,
  serviceId: string,
): Promise<Response> {
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  // Validate ID format
  const idValidation = validate(objectIdSchema, serviceId);
  if (!idValidation.success) return notFound("Service not found");

  const service = await Service.findByIdAndUpdate(
    serviceId,
    { $set: { isActive: false } },
    { new: true },
  );

  if (!service) {
    return notFound("Service not found");
  }

  return Response.json({ message: "Service deleted successfully" });
}
