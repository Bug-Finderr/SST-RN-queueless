import { handleMakeAdmin } from "./routes/admin";
import { handleGetMe, handleLogin, handleRegister } from "./routes/auth";
import {
  handleCreateService,
  handleDeleteService,
  handleListServices,
  handleUpdateService,
} from "./routes/services";
import {
  handleBookToken,
  handleCallNext,
  handleCancelToken,
  handleCompleteToken,
  handleGetMyTokens,
  handleGetNotifications,
  handleGetQueueStatus,
  handleGetServiceTokens,
  handleSkipToken,
} from "./routes/tokens";
import type { Handler, Params } from "./types";

export type { Handler, Params } from "./types";

// Declarative route table (exported for Express compatibility)
export const routes: { method: string; path: string; handler: Handler }[] = [
  // Health
  {
    method: "GET",
    path: "/api/",
    handler: () =>
      Response.json({ message: "QueueLess API is running", version: "1.0.0" }),
  },
  // Auth
  {
    method: "POST",
    path: "/api/auth/register",
    handler: (req) => handleRegister(req),
  },
  {
    method: "POST",
    path: "/api/auth/login",
    handler: (req) => handleLogin(req),
  },
  { method: "GET", path: "/api/auth/me", handler: (req) => handleGetMe(req) },
  // Services
  { method: "GET", path: "/api/services", handler: () => handleListServices() },
  {
    method: "POST",
    path: "/api/services",
    handler: (req) => handleCreateService(req),
  },
  {
    method: "PUT",
    path: "/api/services/:id",
    handler: (req, p) => handleUpdateService(req, p.id as string),
  },
  {
    method: "DELETE",
    path: "/api/services/:id",
    handler: (req, p) => handleDeleteService(req, p.id as string),
  },
  // Tokens
  {
    method: "POST",
    path: "/api/tokens/book",
    handler: (req) => handleBookToken(req),
  },
  {
    method: "GET",
    path: "/api/tokens/my",
    handler: (req) => handleGetMyTokens(req),
  },
  {
    method: "GET",
    path: "/api/tokens/notifications",
    handler: (req) => handleGetNotifications(req),
  },
  {
    method: "DELETE",
    path: "/api/tokens/:id",
    handler: (req, p) => handleCancelToken(req, p.id as string),
  },
  {
    method: "GET",
    path: "/api/tokens/queue/:serviceId",
    handler: (_, p) => handleGetQueueStatus(p.serviceId as string),
  },
  {
    method: "POST",
    path: "/api/tokens/complete/:serviceId",
    handler: (req, p) => handleCompleteToken(req, p.serviceId as string),
  },
  {
    method: "POST",
    path: "/api/tokens/call-next/:serviceId",
    handler: (req, p) => handleCallNext(req, p.serviceId as string),
  },
  {
    method: "POST",
    path: "/api/tokens/skip/:tokenId",
    handler: (req, p) => handleSkipToken(req, p.tokenId as string),
  },
  {
    method: "GET",
    path: "/api/tokens/service/:serviceId",
    handler: (req, p) => handleGetServiceTokens(req, p.serviceId as string),
  },
  // Admin
  {
    method: "POST",
    path: "/api/admin/make-admin/:email",
    handler: (req, p) => handleMakeAdmin(req, p.email as string),
  },
];

// Match path pattern, extract params
function matchPath(
  pathname: string,
  pattern: string,
): { match: boolean; params: Params } {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  if (patternParts.length !== pathParts.length)
    return { match: false, params: {} };

  const params: Params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i] ?? "";
    const path = pathParts[i] ?? "";
    if (pp.startsWith(":")) params[pp.slice(1)] = path;
    else if (pp !== path) return { match: false, params: {} };
  }
  return { match: true, params };
}

// Router function
export async function router(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  for (const route of routes) {
    if (route.method !== request.method) continue;
    const { match, params } = matchPath(pathname, route.path);
    if (match) return route.handler(request, params);
  }
  return null;
}
