import mongoose from "mongoose";

import { config } from "./config";

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, { dbName: config.dbName });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}
