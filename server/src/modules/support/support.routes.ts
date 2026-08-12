import express from 'express';

import { requireCsrfToken, requireTrustedOrigin } from '../shared/middleware/request-security.js';
import { supportChatLimiter } from '../shared/middleware/rate-limit.js';
import { supportChatHandler } from './support.controller.js';

export const supportRouter = express.Router();

supportRouter.post(
  '/chat',
  requireTrustedOrigin,
  requireCsrfToken,
  supportChatLimiter,
  supportChatHandler
);
