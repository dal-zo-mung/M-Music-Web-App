import type { NextFunction, Request, Response } from 'express';

import {
  adminActivateRelease,
  adminCreateCategory,
  adminCreateDesktopSong,
  adminCreateRelease,
  adminDeleteCategory,
  adminDeleteDesktopSong,
  adminDeleteRelease,
  adminListCategories,
  adminListDesktopSongs,
  adminListLegal,
  adminListReleases,
  adminToggleDesktopSongPublish,
  adminUpdateCategory,
  adminUpdateDesktopSong,
  adminUpsertLegal,
  checkDesktopSongUpdates,
  getLatestRelease,
  getLegalDocument,
  getPublicDesktopSongById,
  listPublicCategories,
  listPublicDesktopSongs
} from './desktop.service.js';

// ── Public: Songs ─────────────────────────────────────────────────────────

export async function listPublicSongsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const songs = await listPublicDesktopSongs(req.query);
    res.json({ songs });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSongByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const song = await getPublicDesktopSongById(String(req.params.songId));
    res.json({ song });
  } catch (error) {
    next(error);
  }
}

export async function checkUpdatesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { songs } = req.body as { songs: Array<{ id: string; updated_at: string | null }> };
    if (!Array.isArray(songs)) {
      res.status(400).json({ error: 'songs array is required.', success: false });
      return;
    }
    const results = await checkDesktopSongUpdates(songs);
    res.json({ results });
  } catch (error) {
    next(error);
  }
}

// ── Public: Categories ────────────────────────────────────────────────────

export async function listPublicCategoriesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await listPublicCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

// ── Public: Latest Release ────────────────────────────────────────────────

export async function getLatestReleaseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
    const release = await getLatestRelease(platform);
    res.json({ release });
  } catch (error) {
    next(error);
  }
}

// ── Public: Legal ─────────────────────────────────────────────────────────

export async function getLegalHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const document = await getLegalDocument(String(req.params.type));
    res.json({ document });
  } catch (error) {
    next(error);
  }
}

// ── Admin: Desktop Songs ──────────────────────────────────────────────────

export async function adminListDesktopSongsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await adminListDesktopSongs(req.query as Record<string, unknown>);
    res.json({ status: true, message: 'Songs retrieved successfully.', data });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateDesktopSongHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const song = await adminCreateDesktopSong(req.body);
    res.status(201).json({ status: true, message: 'Song created successfully.', data: { song } });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateDesktopSongHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const song = await adminUpdateDesktopSong(String(req.params.songId), req.body);
    res.json({ status: true, message: 'Song updated successfully.', data: { song } });
  } catch (error) {
    next(error);
  }
}

export async function adminPublishDesktopSongHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const is_published = Boolean(req.body.is_published);
    const song = await adminToggleDesktopSongPublish(String(req.params.songId), is_published);
    res.json({ status: true, message: 'Song publish status updated successfully.', data: { song } });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteDesktopSongHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminDeleteDesktopSong(String(req.params.songId));
    res.json({ status: true, message: 'Song deleted successfully.', data: {} });
  } catch (error) {
    next(error);
  }
}

// ── Admin: Categories ─────────────────────────────────────────────────────

export async function adminListCategoriesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ status: true, message: 'Categories retrieved successfully.', data: { categories: await adminListCategories() } });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, language } = req.body as { name: string; language?: string };
    const category = await adminCreateCategory(name, language);
    res.status(201).json({ status: true, message: 'Category created successfully.', data: { category } });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, language } = req.body as { name: string; language?: string };
    const category = await adminUpdateCategory(String(req.params.categoryId), name, language);
    res.json({ status: true, message: 'Category updated successfully.', data: { category } });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminDeleteCategory(String(req.params.categoryId));
    res.json({ status: true, message: 'Category deleted successfully.', data: {} });
  } catch (error) {
    next(error);
  }
}

// ── Admin: Releases ───────────────────────────────────────────────────────

export async function adminListReleasesHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ status: true, message: 'Releases retrieved successfully.', data: { releases: await adminListReleases() } });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateReleaseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const release = await adminCreateRelease(req.body);
    res.status(201).json({ status: true, message: 'Release created successfully.', data: { release } });
  } catch (error) {
    next(error);
  }
}

export async function adminActivateReleaseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const release = await adminActivateRelease(String(req.params.releaseId));
    res.json({ status: true, message: 'Release activated successfully.', data: { release } });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteReleaseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminDeleteRelease(String(req.params.releaseId));
    res.json({ status: true, message: 'Release deleted successfully.', data: {} });
  } catch (error) {
    next(error);
  }
}

// ── Admin: Legal Documents ────────────────────────────────────────────────

export async function adminListLegalHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ status: true, message: 'Legal documents retrieved successfully.', data: { documents: await adminListLegal() } });
  } catch (error) {
    next(error);
  }
}

export async function adminUpsertLegalHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content } = req.body as { title: string; content: string };
    const document = await adminUpsertLegal(String(req.params.type), title, content);
    res.json({ status: true, message: 'Legal document upserted successfully.', data: { document } });
  } catch (error) {
    next(error);
  }
}
