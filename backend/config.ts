// Environment configuration (Bun auto-loads .env)

const required = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
};

export const config = {
  mongoUri: required("MONGO_URI"),
  dbName: required("DB_NAME"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
  port: Number(process.env.PORT) || 8000,
  corsOrigins: (
    process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173"
  ).split(","),
  notifyWhenPositionNear: Number(process.env.NOTIFY_POSITION) || 3,
  isDev: process.env.NODE_ENV !== "production",
} as const;
