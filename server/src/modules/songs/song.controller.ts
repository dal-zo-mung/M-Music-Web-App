import type { NextFunction, Request, Response } from 'express';

import { getSongById, listSongs, searchSongs, addFavorite, removeFavorite, getUserFavorites, isSongFavorited } from './song.service.js';

export async function listSongsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await listSongs());
  } catch (error) {
    next(error);
  }
}

// Legacy route: GET /api/songs/search/:query  (backwards compat)
export async function searchSongsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await searchSongs(req.params.query, undefined, req.query.limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// New route: GET /api/songs/search?q=&category=&limit=
export async function searchSongsByParamsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await searchSongs(req.query.q, req.query.category, req.query.limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSongByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const song = await getSongById(String(req.params.id));

    if (!song) {
      res.status(404).json({
        message: 'Song not found.',
        success: false
      });
      return;
    }

    res.json(song);
  } catch (error) {
    next(error);
  }
}

export async function addFavoriteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        message: 'Authentication is required.',
        success: false
      });
      return;
    }

    await addFavorite(String(user._id), String(req.params.songId));
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Song not found') {
      res.status(404).json({
        message: 'Song not found.',
        success: false
      });
      return;
    }
    next(error);
  }
}

export async function removeFavoriteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        message: 'Authentication is required.',
        success: false
      });
      return;
    }

    await removeFavorite(String(user._id), String(req.params.songId));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getUserFavoritesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        message: 'Authentication is required.',
        success: false
      });
      return;
    }

    const favorites = await getUserFavorites(String(user._id));
    res.json(favorites);
  } catch (error) {
    next(error);
  }
}

export async function isSongFavoritedHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({
        message: 'Authentication is required.',
        success: false
      });
      return;
    }

    const isFavorited = await isSongFavorited(String(user._id), String(req.params.songId));
    res.json({ isFavorited });
  } catch (error) {
    next(error);
  }
}
