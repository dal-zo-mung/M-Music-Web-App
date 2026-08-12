import express from 'express';

import { validateObjectIdParam } from '../shared/middleware/validation.js';
import { getSongByIdHandler, listSongsHandler, searchSongsHandler, searchSongsByParamsHandler, addFavoriteHandler, removeFavoriteHandler, getUserFavoritesHandler, isSongFavoritedHandler } from './song.controller.js';
import { requireAuthenticatedUser } from '../auth/auth.guard.js';
import { requireCsrfToken, requireTrustedOrigin } from '../shared/middleware/request-security.js';
import { apiWriteLimiter } from '../shared/middleware/rate-limit.js';

export const songsRouter = express.Router();

songsRouter.get('/', listSongsHandler);
// New: GET /api/songs/search?q=&category=&limit=
songsRouter.get('/search', searchSongsByParamsHandler);
// Legacy: GET /api/songs/search/:query  (backwards compat — kept for old clients)
songsRouter.get('/search/:query', searchSongsHandler);

// Favorites routes
songsRouter.get('/favorites', requireTrustedOrigin, requireAuthenticatedUser, getUserFavoritesHandler);
songsRouter.get('/:songId/favorite', requireTrustedOrigin, requireAuthenticatedUser, validateObjectIdParam('songId'), isSongFavoritedHandler);
songsRouter.post('/:songId/favorite', requireTrustedOrigin, requireCsrfToken, requireAuthenticatedUser, apiWriteLimiter, validateObjectIdParam('songId'), addFavoriteHandler);
songsRouter.delete('/:songId/favorite', requireTrustedOrigin, requireCsrfToken, requireAuthenticatedUser, apiWriteLimiter, validateObjectIdParam('songId'), removeFavoriteHandler);

songsRouter.get('/:id', validateObjectIdParam('id'), getSongByIdHandler);
