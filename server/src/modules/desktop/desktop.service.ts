import type {
  DesktopCategory,
  DesktopSong,
  LegalDocument,
  Release,
} from "../../../../shared/types.js";
import mongoose from "mongoose";
import { DesktopCategoryModel } from "./desktop-category.model.js";
import {
  DesktopSongModel,
  type DesktopSongPersistenceRecord,
} from "./desktop-song.model.js";
import { LegalDocumentModel, type LegalDocType } from "./legal.model.js";
import { ReleaseModel } from "./release.model.js";

// ── Helpers ────────────────────────────────────────────────────────────────

type HttpError = Error & { statusCode?: number };

function httpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toDesktopSong(doc: any): DesktopSong {
  return {
    id: String(doc._id),
    title: doc.title,
    artist: doc.artist,
    language: doc.language,
    category: doc.category,
    lyrics_json: doc.lyrics_json,
    thumbnail_color: doc.thumbnail_color,
    is_published: doc.is_published,
    download_count: doc.download_count,
    created_at: doc.createdAt?.toISOString() ?? "",
    updated_at: doc.updatedAt?.toISOString() ?? "",
  };
}

function toDesktopCategory(doc: any): DesktopCategory {
  return {
    id: String(doc._id),
    name: doc.name,
    language: doc.language,
    song_count: doc.song_count ?? 0,
  };
}

function toRelease(doc: any): Release {
  return {
    id: String(doc._id),
    version: doc.version,
    release_notes: doc.release_notes ?? null,
    platform: doc.platform,
    download_url: doc.download_url,
    is_active: doc.is_active,
    created_at: doc.createdAt?.toISOString() ?? "",
  };
}

function toLegalDocument(doc: any): LegalDocument {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    content: doc.content,
    updated_at: doc.updatedAt?.toISOString() ?? "",
  };
}

// ── Public: Desktop Songs ──────────────────────────────────────────────────

export interface DesktopSongQuery {
  q?: unknown;
  language?: unknown;
  category?: unknown;
  limit?: unknown;
  offset?: unknown;
}

export async function listPublicDesktopSongs(
  query: DesktopSongQuery,
): Promise<DesktopSong[]> {
  const rawQ = typeof query.q === "string" ? query.q.trim() : "";
  const language =
    typeof query.language === "string" ? query.language.trim() : "";
  const category =
    typeof query.category === "string" ? query.category.trim() : "";
  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const filter: Record<string, unknown> = { is_published: true };

  if (rawQ && rawQ.length <= 100) {
    const escaped = escapeRegex(rawQ);
    filter.$or = [
      { title: mongoose.trusted({ $regex: escaped, $options: "i" }) },
      { artist: mongoose.trusted({ $regex: escaped, $options: "i" }) },
    ];
  }

  if (language && language !== "all") {
    filter.language = language;
  }

  if (category && category !== "all") {
    filter.category = category;
  }

  const docs = await DesktopSongModel.find(mongoose.trusted(filter))
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();

  return docs.map(toDesktopSong);
}

export async function getPublicDesktopSongById(
  id: string,
): Promise<DesktopSong> {
  const doc = await DesktopSongModel.findOneAndUpdate(
    { _id: id, is_published: true },
    { $inc: { download_count: 1 } },
    { new: true },
  ).exec();

  if (!doc) {
    throw httpError("Desktop song not found.", 404);
  }

  return toDesktopSong(doc);
}

export async function checkDesktopSongUpdates(
  songs: Array<{ id: string; updated_at: string | null }>,
): Promise<Array<{ id: string; hasUpdate: boolean }>> {
  const ids = songs.map((s) => s.id);
  const docs = await DesktopSongModel.find(
    { _id: mongoose.trusted({ $in: ids }), is_published: true },
    { _id: 1, updatedAt: 1 },
  ).lean();

  return songs.map(({ id, updated_at }) => {
    const doc = docs.find((d) => String(d._id) === id);
    if (!doc) return { id, hasUpdate: false };
    const serverUpdated = (doc as any).updatedAt?.toISOString?.() ?? "";
    return { id, hasUpdate: updated_at !== serverUpdated };
  });
}

// ── Public: Categories ────────────────────────────────────────────────────

export async function listPublicCategories(): Promise<DesktopCategory[]> {
  const categories = await DesktopCategoryModel.find({})
    .sort({ name: 1 })
    .lean();

  // Compute song counts
  const counts = await DesktopSongModel.aggregate([
    { $match: { is_published: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return categories.map((cat) => ({
    ...toDesktopCategory(cat),
    song_count: countMap[cat.name] ?? 0,
  }));
}

// ── Public: Latest Release ────────────────────────────────────────────────

export async function getLatestRelease(
  platform?: string,
): Promise<Release | null> {
  const filter: Record<string, unknown> = { is_active: true };
  if (platform && ["win", "mac", "linux"].includes(platform)) {
    filter.$or = [{ platform }, { platform: "all" }];
  }

  const doc = await ReleaseModel.findOne(mongoose.trusted(filter) as any)
    .sort({ createdAt: -1 })
    .exec();
  return doc ? toRelease(doc) : null;
}

// ── Public: Legal Documents ───────────────────────────────────────────────

export async function getLegalDocument(type: string): Promise<LegalDocument> {
  const validTypes: LegalDocType[] = ["terms", "privacy", "copyright"];
  if (!validTypes.includes(type as LegalDocType)) {
    throw httpError("Invalid legal document type.", 400);
  }

  const docType = type as LegalDocType;
  const doc = await LegalDocumentModel.findOne({ type: docType }).exec();
  if (!doc) {
    throw httpError("Legal document not found.", 404);
  }

  return toLegalDocument(doc);
}

// ── Admin: Desktop Songs ──────────────────────────────────────────────────

export async function adminListDesktopSongs(
  query: Record<string, unknown>,
): Promise<{
  songs: DesktopSong[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  const rawQ = typeof query.q === "string" ? query.q.trim() : "";
  if (rawQ) {
    const escaped = escapeRegex(rawQ);
    filter.$or = [
      { title: mongoose.trusted({ $regex: escaped, $options: "i" }) },
      { artist: mongoose.trusted({ $regex: escaped, $options: "i" }) },
    ];
  }

  const [docs, totalItems] = await Promise.all([
    DesktopSongModel.find(mongoose.trusted(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DesktopSongModel.countDocuments(mongoose.trusted(filter)),
  ]);

  return {
    songs: docs.map(toDesktopSong),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}

export async function adminCreateDesktopSong(
  data: Partial<DesktopSongPersistenceRecord>,
): Promise<DesktopSong> {
  if (!data.title?.trim()) {
    throw httpError("Song title is required.", 400);
  }
  if (!data.lyrics_json?.slides?.length) {
    throw httpError("At least one slide is required.", 400);
  }

  const doc = await DesktopSongModel.create({
    title: data.title.trim(),
    artist: data.artist?.trim(),
    language: data.language || "my",
    category: data.category || "worship",
    lyrics_json: data.lyrics_json,
    thumbnail_color: data.thumbnail_color,
    is_published: false,
    download_count: 0,
  });

  return toDesktopSong(doc);
}

export async function adminUpdateDesktopSong(
  id: string,
  data: Partial<DesktopSongPersistenceRecord>,
): Promise<DesktopSong> {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = String(data.title).trim();
  if (data.artist !== undefined) update.artist = data.artist;
  if (data.language !== undefined) update.language = data.language;
  if (data.category !== undefined) update.category = data.category;
  if (data.lyrics_json !== undefined) update.lyrics_json = data.lyrics_json;
  if (data.thumbnail_color !== undefined)
    update.thumbnail_color = data.thumbnail_color;

  const doc = await DesktopSongModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  ).lean();
  if (!doc) throw httpError("Desktop song not found.", 404);
  return toDesktopSong(doc);
}

export async function adminToggleDesktopSongPublish(
  id: string,
  is_published: boolean,
): Promise<DesktopSong> {
  const doc = await DesktopSongModel.findByIdAndUpdate(
    id,
    { $set: { is_published } },
    { new: true },
  ).lean();
  if (!doc) throw httpError("Desktop song not found.", 404);
  return toDesktopSong(doc);
}

export async function adminDeleteDesktopSong(id: string): Promise<void> {
  const result = await DesktopSongModel.deleteOne({ _id: id });
  if (result.deletedCount === 0)
    throw httpError("Desktop song not found.", 404);
}

// ── Admin: Categories ─────────────────────────────────────────────────────

export async function adminListCategories(): Promise<DesktopCategory[]> {
  const categories = await DesktopCategoryModel.find({})
    .sort({ name: 1 })
    .lean();
  const counts = await DesktopSongModel.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return categories.map((cat) => ({
    ...toDesktopCategory(cat),
    song_count: countMap[cat.name] ?? 0,
  }));
}

export async function adminCreateCategory(
  name: string,
  language?: string,
): Promise<DesktopCategory> {
  if (!name?.trim()) throw httpError("Category name is required.", 400);
  const doc = await DesktopCategoryModel.create({
    name: name.trim(),
    language,
  });
  return toDesktopCategory(doc);
}

export async function adminUpdateCategory(
  id: string,
  name: string,
  language?: string,
): Promise<DesktopCategory> {
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = String(name).trim();
  if (language !== undefined) update.language = language;
  const doc = await DesktopCategoryModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  ).lean();
  if (!doc) throw httpError("Category not found.", 404);
  return toDesktopCategory(doc);
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const result = await DesktopCategoryModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw httpError("Category not found.", 404);
}

// ── Admin: Releases ───────────────────────────────────────────────────────

export async function adminListReleases(): Promise<Release[]> {
  const docs = await ReleaseModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map(toRelease);
}

export async function adminCreateRelease(data: {
  version: string;
  release_notes?: string;
  platform: string;
  download_url: string;
}): Promise<Release> {
  if (!data.version?.trim()) throw httpError("Version is required.", 400);
  if (!data.download_url?.trim())
    throw httpError("Download URL is required.", 400);

  const doc = await ReleaseModel.create({
    version: data.version.trim(),
    release_notes: data.release_notes?.trim(),
    platform: (data.platform as any) || "win",
    download_url: data.download_url.trim(),
    is_active: false,
  });

  return toRelease(doc);
}

export async function adminActivateRelease(id: string): Promise<Release> {
  // Deactivate all releases first
  await ReleaseModel.updateMany({}, { $set: { is_active: false } });

  const doc = await ReleaseModel.findByIdAndUpdate(
    id,
    { $set: { is_active: true } },
    { new: true },
  ).exec();

  if (!doc) throw httpError("Release not found.", 404);
  return toRelease(doc);
}

export async function adminDeleteRelease(id: string): Promise<void> {
  const result = await ReleaseModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw httpError("Release not found.", 404);
}

// ── Admin: Legal Documents ────────────────────────────────────────────────

export async function adminListLegal(): Promise<LegalDocument[]> {
  const docs = await LegalDocumentModel.find({}).lean();
  return docs.map(toLegalDocument);
}

export async function adminUpsertLegal(
  type: string,
  title: string,
  content: string,
): Promise<LegalDocument> {
  const validTypes: LegalDocType[] = ["terms", "privacy", "copyright"];
  if (!validTypes.includes(type as LegalDocType)) {
    throw httpError("Invalid legal document type.", 400);
  }
  if (!title?.trim()) throw httpError("Title is required.", 400);

  const docType = type as LegalDocType;
  const doc = await LegalDocumentModel.findOneAndUpdate(
    { type: docType },
    { $set: { title: title.trim(), content } },
    { new: true, upsert: true },
  ).exec();

  return toLegalDocument(doc);
}
