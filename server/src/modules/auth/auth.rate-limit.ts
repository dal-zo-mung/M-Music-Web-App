import rateLimit from "express-rate-limit";
import type { Request } from "express";

import { env } from "../../config/env.js";

interface RateLimitedRequest extends Request {
  rateLimit?: {
    resetTime?: Date;
  };
}

function getRetryAfterSeconds(req: RateLimitedRequest): number {
  const resetTime = req.rateLimit?.resetTime;

  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }

  return Math.max(1, Math.ceil(env.authRateLimitWindowMs / 1000));
}

function formatRetryMessage(retryAfterSeconds: number): string {
  if (retryAfterSeconds < 60) {
    return `Too many attempts. Please wait ${retryAfterSeconds} seconds before trying again.`;
  }

  const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

  return `Too many attempts. Please wait ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? "" : "s"} before trying again.`;
}

export const authWriteLimiter = rateLimit({
  handler: (req, res) => {
    const retryAfterSeconds = getRetryAfterSeconds(req);
    const retryMessage = formatRetryMessage(retryAfterSeconds);

    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      error: retryMessage,
      message: retryMessage,
      retryAfterSeconds,
      status: 429,
      success: false,
    });
  },
  legacyHeaders: false,
  max: env.authRateLimitMax,
  skipSuccessfulRequests: false,
  standardHeaders: "draft-8",
  windowMs: env.authRateLimitWindowMs,
});
