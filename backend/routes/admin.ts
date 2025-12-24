import { requireAdmin } from "../middleware/auth";
import { User } from "../models/user";
import { notFound } from "../utils/response";

// Make user admin - FIXED: Now requires admin authentication
// The Python version had NO authentication on this endpoint!
export async function handleMakeAdmin(
  request: Request,
  email: string,
): Promise<Response> {
  // SECURITY FIX: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof Response) return authResult;

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { role: "admin" } },
    { new: true },
  );

  if (!user) {
    return notFound("User not found");
  }

  return Response.json({
    message: `User ${user.email} is now an admin`,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
