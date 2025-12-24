// Express version of the server - demonstrates migration path
import express from "express";

import { config } from "./config";
import { connectDB } from "./db";
import { routes } from "./router";

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin =
    origin && config.corsOrigins.includes(origin)
      ? origin
      : (config.corsOrigins[0] ?? "*");

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Adapter: Convert Express req to Web Request, and Response to Express res
async function handleRoute(
  handler: (
    req: Request,
    params: Record<string, string>,
  ) => Promise<Response> | Response,
  req: express.Request,
  res: express.Response,
) {
  try {
    // Create Web Request from Express request
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const webRequest = new Request(url, {
      method: req.method,
      headers: req.headers as unknown as Headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    // Call handler with Web Request
    const response = await handler(webRequest, req.params);

    // Convert Web Response to Express response
    res.status(response.status);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Register routes from the declarative route table
for (const route of routes) {
  const method = route.method.toLowerCase() as
    | "get"
    | "post"
    | "put"
    | "delete";
  app[method](route.path, (req, res) => handleRoute(route.handler, req, res));
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
async function start() {
  await connectDB();

  app.listen(config.port, () =>
    console.log(`QueueLess API (Express) running at PORT ${config.port}`),
  );
}

start().catch(console.error);
