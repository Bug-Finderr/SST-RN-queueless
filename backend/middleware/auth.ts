import jwt, { type SignOptions } from "jsonwebtoken";

import { config } from "../config";
import { type IUserDocument, User, type UserRole } from "../models/user";

export interface JWTPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Create JWT token
export function createToken(user: IUserDocument): string {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

// Get authenticated user from request
export async function getAuthUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const token = extractToken(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await User.findById(payload.userId).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

// Require authentication
export async function requireAuth(
  request: Request,
): Promise<AuthenticatedUser | Response> {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing authentication token",
      },
      { status: 401 },
    );
  }
  return user;
}

// Require admin role
export async function requireAdmin(
  request: Request,
): Promise<AuthenticatedUser | Response> {
  const result = await requireAuth(request);
  if (result instanceof Response) return result;

  if (result.role !== "admin") {
    return Response.json(
      { error: "Forbidden", message: "Admin access required" },
      { status: 403 },
    );
  }
  return result;
}

// Password hashing using Bun's native API
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

// Password verification
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}
