import express from 'express';

import { requireAdmin } from './admin.guard.js';
import { requireCsrfToken, requireTrustedOrigin } from '../shared/middleware/request-security.js';
import { validateObjectIdParam } from '../shared/middleware/validation.js';
import {
  createSongHandler,
  deleteUserHandler,
  deleteSongHandler,
  getStatsHandler,
  getUserDetailHandler,
  getSongAdminHandler,
  listCommunityAdminHandler,
  listSongsAdminHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  unlockUserHandler,
  updateCommentStatusHandler,
  updateSongHandler,
  updateSubmissionStatusHandler,
  updateUserRoleHandler
} from './admin.controller.js';

export const adminRouter = express.Router();

// ── Dashboard ───────────────────────────────────────────────
adminRouter.get('/stats', requireAdmin, getStatsHandler);

// ── Users ───────────────────────────────────────────────────
adminRouter.get('/users', requireAdmin, listUsersHandler);
adminRouter.get('/users/:userId', requireAdmin, validateObjectIdParam('userId'), getUserDetailHandler);
adminRouter.patch('/users/:userId/role', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('userId'), updateUserRoleHandler);
adminRouter.patch('/users/:userId/unlock', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('userId'), unlockUserHandler);
adminRouter.patch('/users/:userId/password', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('userId'), resetUserPasswordHandler);
adminRouter.delete('/users/:userId', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('userId'), deleteUserHandler);

// ── Songs ───────────────────────────────────────────────────
adminRouter.get('/songs', requireAdmin, listSongsAdminHandler);
adminRouter.get('/songs/:songId', requireAdmin, validateObjectIdParam('songId'), getSongAdminHandler);
adminRouter.post('/songs', requireTrustedOrigin, requireCsrfToken, requireAdmin, createSongHandler);
adminRouter.patch('/songs/:songId', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('songId'), updateSongHandler);
adminRouter.delete('/songs/:songId', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('songId'), deleteSongHandler);

// ── Community ───────────────────────────────────────────────
adminRouter.get('/community/submissions', requireAdmin, listCommunityAdminHandler);
adminRouter.patch('/community/submissions/:submissionId/status', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('submissionId'), updateSubmissionStatusHandler);
adminRouter.patch('/community/comments/:commentId/status', requireTrustedOrigin, requireCsrfToken, requireAdmin, validateObjectIdParam('commentId'), updateCommentStatusHandler);
