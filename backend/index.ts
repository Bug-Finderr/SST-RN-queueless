import { config } from "./config";
import { connectDB } from "./db";
import { router } from "./router";

await connectDB();

const server = Bun.serve({
  port: config.port,
  async fetch(request: Request): Promise<Response> {
    const start = Date.now();
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    let response: Response;
    try {
      response =
        (await router(request)) ??
        Response.json(
          {
            error: "Not Found",
            message: `Route ${request.method} ${new URL(request.url).pathname} not found`,
          },
          { status: 404 },
        );
    } catch (error) {
      console.error("Request error:", error);
      response = Response.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    // Add CORS headers
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);

    if (config.isDev) {
      console.log(
        `${request.method} ${new URL(request.url).pathname} ${response.status} ${Date.now() - start}ms`,
      );
    }

    return new Response(response.body, { status: response.status, headers });
  },
});

console.log(`🚀 QueueLess API running at http://localhost:${server.port}`);
