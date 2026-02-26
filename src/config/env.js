const dotenv = require("dotenv");

dotenv.config();

const required = ["JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const useMemoryDb = String(process.env.USE_MEMORY_DB || "false").toLowerCase() === "true";

// MONGO_URI is required only when we are not using memory DB mode.
if (!useMemoryDb && !process.env.MONGO_URI) {
  throw new Error("Missing required environment variable: MONGO_URI (or set USE_MEMORY_DB=true)");
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  useMemoryDb,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  cookieExpiresInDays: Number(process.env.COOKIE_EXPIRES_IN_DAYS) || 1,
  clientUrls: (process.env.CLIENT_URLS || "http://localhost:5173").split(",").map((url) => url.trim()),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 120
};
