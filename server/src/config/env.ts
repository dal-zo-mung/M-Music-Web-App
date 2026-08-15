import dotenv from "dotenv";

dotenv.config();

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not set in the environment.`);
  }

  return value;
}

function readNumberEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  const parsedValue = Number.parseInt(rawValue ?? "", 10);

  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

const port = readNumberEnv("PORT", 8888);
const isProduction = process.env.NODE_ENV === "production";
const rawMongoUrl = process.env.MONGODB_URL?.trim() || "";
const mongodbUrl =
  rawMongoUrl &&
  !/<|>|cluster\.mongodb\.net|your-|example\.|replace-this/i.test(rawMongoUrl)
    ? rawMongoUrl
    : "";

const corsAllowedOrigins = new Set(
  [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    process.env.CLIENT_ORIGIN,
    ...String(process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ].filter((origin): origin is string => Boolean(origin)),
);

export const env = {
  authRateLimitMax: readNumberEnv("AUTH_RATE_LIMIT_MAX", 5),
  authRateLimitWindowMs: readNumberEnv(
    "AUTH_RATE_LIMIT_WINDOW_MS",
    5 * 60 * 1000,
  ),
  commentRateLimitMax: readNumberEnv("COMMENT_RATE_LIMIT_MAX", 20),
  commentRateLimitWindowMs: readNumberEnv(
    "COMMENT_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  corsAllowedOrigins,
  csrfCookieName: "m_music.csrf",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL?.trim() || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
  isProduction,
  mongodbUrl,
  port,
  readRateLimitMax: readNumberEnv("READ_RATE_LIMIT_MAX", 240),
  readRateLimitWindowMs: readNumberEnv(
    "READ_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  searchRateLimitMax: readNumberEnv("SEARCH_RATE_LIMIT_MAX", 120),
  searchRateLimitWindowMs: readNumberEnv(
    "SEARCH_RATE_LIMIT_WINDOW_MS",
    10 * 60 * 1000,
  ),
  sessionCookieName: "m_music.sid",
  sessionSecret: readRequiredEnv("SESSION_SECRET"),
  submissionRateLimitMax: readNumberEnv("SUBMISSION_RATE_LIMIT_MAX", 6),
  submissionRateLimitWindowMs: readNumberEnv(
    "SUBMISSION_RATE_LIMIT_WINDOW_MS",
    60 * 60 * 1000,
  ),
  writeRateLimitMax: readNumberEnv("WRITE_RATE_LIMIT_MAX", 80),
  writeRateLimitWindowMs: readNumberEnv(
    "WRITE_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
  groqApiKey: process.env.GROQ_API_KEY?.trim() || "",
  groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
  supportChatRateLimitMax: readNumberEnv("SUPPORT_CHAT_RATE_LIMIT_MAX", 20),
  supportChatRateLimitWindowMs: readNumberEnv(
    "SUPPORT_CHAT_RATE_LIMIT_WINDOW_MS",
    15 * 60 * 1000,
  ),
} as const;
