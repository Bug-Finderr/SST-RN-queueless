// API response helpers

export const notFound = (message = "Resource not found") =>
  Response.json({ error: "Not Found", message }, { status: 404 });

export const badRequest = (message: string) =>
  Response.json({ error: "Bad Request", message }, { status: 400 });

export const unauthorized = (message = "Authentication required") =>
  Response.json({ error: "Unauthorized", message }, { status: 401 });

export const forbidden = (message = "Access denied") =>
  Response.json({ error: "Forbidden", message }, { status: 403 });

// Parse JSON body safely
export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
