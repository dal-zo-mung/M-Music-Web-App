import express from 'express';

import { requireAdmin } from '../admin/admin.guard.js';
import { requireCsrfToken, requireTrustedOrigin } from '../shared/middleware/request-security.js';
import { desktopAuthRouter } from './desktop-auth.routes.js';
import {
  // Public
  listPublicSongsHandler,
  getPublicSongByIdHandler,
  checkUpdatesHandler,
  listPublicCategoriesHandler,
  getLatestReleaseHandler,
  getLegalHandler,
  // Admin: Songs
  adminListDesktopSongsHandler,
  adminCreateDesktopSongHandler,
  adminUpdateDesktopSongHandler,
  adminPublishDesktopSongHandler,
  adminDeleteDesktopSongHandler,
  // Admin: Categories
  adminListCategoriesHandler,
  adminCreateCategoryHandler,
  adminUpdateCategoryHandler,
  adminDeleteCategoryHandler,
  // Admin: Releases
  adminListReleasesHandler,
  adminCreateReleaseHandler,
  adminActivateReleaseHandler,
  adminDeleteReleaseHandler,
  // Admin: Legal
  adminListLegalHandler,
  adminUpsertLegalHandler
} from './desktop.controller.js';

// ── Public router (called by the Desktop app) ──────────────────────────────
// Mounted at /api/desktop

export const desktopPublicRouter = express.Router();

desktopPublicRouter.use('/auth', desktopAuthRouter);
desktopPublicRouter.get('/songs', listPublicSongsHandler);
desktopPublicRouter.post('/songs/check-updates', checkUpdatesHandler);
desktopPublicRouter.get('/songs/categories', listPublicCategoriesHandler);
desktopPublicRouter.get('/songs/:songId', getPublicSongByIdHandler);
desktopPublicRouter.get('/releases/latest', getLatestReleaseHandler);
desktopPublicRouter.get('/legal/:type', getLegalHandler);

// ── Admin router (called by Admin Dashboard) ───────────────────────────────
// Mounted at /api/admin/desktop

export const desktopAdminRouter = express.Router();

const csrfMutate = [requireTrustedOrigin, requireCsrfToken, requireAdmin];

// Desktop Songs
desktopAdminRouter.get('/songs', requireAdmin, adminListDesktopSongsHandler);
desktopAdminRouter.post('/songs', ...csrfMutate, adminCreateDesktopSongHandler);
desktopAdminRouter.patch('/songs/:songId', ...csrfMutate, adminUpdateDesktopSongHandler);
desktopAdminRouter.patch('/songs/:songId/publish', ...csrfMutate, adminPublishDesktopSongHandler);
desktopAdminRouter.delete('/songs/:songId', ...csrfMutate, adminDeleteDesktopSongHandler);

// Categories
desktopAdminRouter.get('/categories', requireAdmin, adminListCategoriesHandler);
desktopAdminRouter.post('/categories', ...csrfMutate, adminCreateCategoryHandler);
desktopAdminRouter.patch('/categories/:categoryId', ...csrfMutate, adminUpdateCategoryHandler);
desktopAdminRouter.delete('/categories/:categoryId', ...csrfMutate, adminDeleteCategoryHandler);

// Releases
desktopAdminRouter.get('/releases', requireAdmin, adminListReleasesHandler);
desktopAdminRouter.post('/releases', ...csrfMutate, adminCreateReleaseHandler);
desktopAdminRouter.patch('/releases/:releaseId/activate', ...csrfMutate, adminActivateReleaseHandler);
desktopAdminRouter.delete('/releases/:releaseId', ...csrfMutate, adminDeleteReleaseHandler);

// Legal Documents
desktopAdminRouter.get('/legal', requireAdmin, adminListLegalHandler);
desktopAdminRouter.put('/legal/:type', ...csrfMutate, adminUpsertLegalHandler);
