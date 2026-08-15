import rateLimit from "express-rate-limit";

import { env } from "../../../config/env.js";

function buildLimiter(options: {
  max: number;
  message: string;
  windowMs: number;
}) {
  return rateLimit({
    legacyHeaders: false,
    max: options.max,
    standardHeaders: "draft-8",
    windowMs: options.windowMs,
    handler: (_req, res) => {
      res.status(429).json({
        error: options.message,
        message: options.message,
        status: 429,
        success: false,
      });
    },
  });
}

export const apiReadLimiter = buildLimiter({
  max: env.readRateLimitMax,
  message: "Too many read requests. Please slow down and try again shortly.",
  windowMs: env.readRateLimitWindowMs,
});

export const apiWriteLimiter = buildLimiter({
  max: env.writeRateLimitMax,
  message: "Too many write requests. Please slow down and try again shortly.",
  windowMs: env.writeRateLimitWindowMs,
});

export const searchLimiter = buildLimiter({
  max: env.searchRateLimitMax,
  message:
    "Too many search requests. Please wait a moment before searching again.",
  windowMs: env.searchRateLimitWindowMs,
});

export const communitySubmissionLimiter = buildLimiter({
  max: env.submissionRateLimitMax,
  message: "Too many lyric submissions. Please wait before posting again.",
  windowMs: env.submissionRateLimitWindowMs,
});

export const communityCommentLimiter = buildLimiter({
  max: env.commentRateLimitMax,
  message: "Too many comments. Please wait before posting again.",
  windowMs: env.commentRateLimitWindowMs,
});

export const supportChatLimiter = buildLimiter({
  max: env.supportChatRateLimitMax,
  message: "Too many support chat messages. Please wait before trying again.",
  windowMs: env.supportChatRateLimitWindowMs,
});
