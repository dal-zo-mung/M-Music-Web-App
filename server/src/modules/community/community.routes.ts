import express from "express";

import { requireAuthenticatedUser } from "../auth/auth.guard.js";
import {
  communityCommentLimiter,
  communitySubmissionLimiter,
} from "../shared/middleware/rate-limit.js";
import {
  requireCsrfToken,
  requireTrustedOrigin,
} from "../shared/middleware/request-security.js";
import { validateObjectIdParam } from "../shared/middleware/validation.js";
import {
  createCommunityCommentHandler,
  createCommunitySubmissionHandler,
  getCommunitySubmissionDetailsHandler,
  listCommunityFeedHandler,
} from "./community.controller.js";

export const communityRouter = express.Router();

communityRouter.get("/submissions", listCommunityFeedHandler);
communityRouter.get(
  "/submissions/:submissionId",
  validateObjectIdParam("submissionId"),
  getCommunitySubmissionDetailsHandler,
);
communityRouter.post(
  "/submissions",
  requireTrustedOrigin,
  requireCsrfToken,
  requireAuthenticatedUser,
  communitySubmissionLimiter,
  createCommunitySubmissionHandler,
);
communityRouter.post(
  "/submissions/:submissionId/comments",
  validateObjectIdParam("submissionId"),
  requireTrustedOrigin,
  requireCsrfToken,
  requireAuthenticatedUser,
  communityCommentLimiter,
  createCommunityCommentHandler,
);
