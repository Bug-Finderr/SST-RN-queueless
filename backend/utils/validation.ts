import { z } from "zod";

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  name: z.string().min(1, "Name is required").max(100),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Service validation schemas
export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).default(""),
  avgServiceTimeMins: z
    .number()
    .int()
    .min(1, "Must be at least 1 minute")
    .max(480, "Cannot exceed 8 hours"),
});

// MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

// Validate and parse with error response
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: Response } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`,
    );
    return {
      success: false,
      error: Response.json(
        { error: "Validation Error", message: errors.join(", ") },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}
