import {
  createToken,
  hashPassword,
  requireAuth,
  verifyPassword,
} from "../middleware/auth";
import { User } from "../models/user";
import type { AuthenticatedUser } from "../types";
import { badRequest, parseBody, unauthorized } from "../utils/response";
import { loginSchema, registerSchema, validate } from "../utils/validation";

export async function handleRegister(request: Request): Promise<Response> {
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const validation = validate(registerSchema, body);
  if (!validation.success) return validation.error;

  const { email, name, password } = validation.data;

  // Check if email already exists
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  }).lean();
  if (existingUser) {
    return badRequest("Email already registered");
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase(),
    name,
    passwordHash,
    role: "user",
  });

  // Generate token
  const token = createToken(user);

  return Response.json(
    {
      access_token: token,
      token_type: "bearer",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    { status: 201 },
  );
}

export async function handleLogin(request: Request): Promise<Response> {
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const validation = validate(loginSchema, body);
  if (!validation.success) return validation.error;

  const { email, password } = validation.data;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return unauthorized("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return unauthorized("Invalid email or password");
  }

  // Generate token
  const token = createToken(user);

  return Response.json({
    access_token: token,
    token_type: "bearer",
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

export async function handleGetMe(request: Request): Promise<Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const user = authResult as AuthenticatedUser;

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
