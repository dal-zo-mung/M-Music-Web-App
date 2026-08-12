import mongoose from 'mongoose';

import type { SongRecord } from '../../../../shared/types.js';
import { SongModel, type SongPersistenceRecord } from './song.model.js';
import { FavoriteModel } from './favorite.model.js';

const DEFAULT_SEARCH_LIMIT = 30;
const MAX_SEARCH_LIMIT = 100;
const MAX_QUERY_LENGTH = 100;

type HttpError = Error & { statusCode?: number };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSearchQuery(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseLimit(limitValue: unknown): number {
  const parsedLimit = Number.parseInt(String(limitValue ?? ''), 10);

  if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(MAX_SEARCH_LIMIT, parsedLimit);
}

function toSongRecord(song: SongPersistenceRecord & { _id: unknown }): SongRecord {
  return {
    'About Song': song['About Song'] ?? '',
    'Direct to YT': song['Direct to YT'] ?? '',
    'Released Date': song['Released Date'] ?? '',
    'Song Title': song['Song Title'],
    Artist: song.Artist,
    Lyric: Array.isArray(song.Lyric) ? song.Lyric : [],
    _id: String(song._id),
    albumCover: song.albumCover ?? 'images/music-logo.jpg',
    category: song.category
  };
}

export async function listSongs(): Promise<SongRecord[]> {
  const songs = await SongModel.find({ status: mongoose.trusted({ $ne: 'removed' }) })
    .lean<Array<SongPersistenceRecord & { _id: unknown }>>()
    .exec();

  return songs.map(toSongRecord);
}

export async function searchSongs(
  query: unknown,
  category: unknown,
  limitValue: unknown
): Promise<SongRecord[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedCategory = normalizeSearchQuery(category);

  // Require at least one filter to be present
  if (!normalizedQuery && !normalizedCategory) {
    return [];
  }

  if (normalizedQuery.length > MAX_QUERY_LENGTH) {
    const error = new Error(`Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`) as HttpError;
    error.statusCode = 400;
    throw error;
  }

  // Build the MongoDB filter
  const filter: Record<string, unknown> = {
    status: mongoose.trusted({ $ne: 'removed' })
  };

  // Text search across title / artist / about
  if (normalizedQuery) {
    const regex = new RegExp(escapeRegex(normalizedQuery), 'i');
    filter['$or'] = [
      { 'About Song': regex },
      { 'Song Title': regex },
      { Artist: regex }
    ];
  }

  // Category filter — exact slug match (case-insensitive)
  if (normalizedCategory) {
    filter['category'] = new RegExp(`^${escapeRegex(normalizedCategory)}$`, 'i');
  }

  const songs = await SongModel.find(mongoose.trusted(filter))
    .limit(parseLimit(limitValue))
    .lean<Array<SongPersistenceRecord & { _id: unknown }>>()
    .exec();

  return songs.map(toSongRecord);
}

export async function getSongById(id: string): Promise<SongRecord | null> {
  const song = await SongModel.findById(id).lean<SongPersistenceRecord & { _id: unknown }>().exec();

  return song ? toSongRecord(song) : null;
}

export async function addFavorite(userId: string, songId: string): Promise<void> {
  // Verify the song exists before adding.
  const song = await SongModel.findById(songId).exec();
  if (!song) {
    throw new Error('Song not found');
  }

  await FavoriteModel.updateOne(
    { userId, songId },
    { $setOnInsert: { userId, songId } },
    { upsert: true }
  ).exec();
}

export async function removeFavorite(userId: string, songId: string): Promise<void> {
  await FavoriteModel.deleteOne({ userId, songId }).exec();
}

export async function getUserFavorites(userId: string): Promise<SongRecord[]> {
  const favorites = await FavoriteModel.find({ userId }).lean().exec();
  const songIds = favorites.map(fav => fav.songId);

  if (songIds.length === 0) {
    return [];
  }

  const songs = await SongModel.find({ _id: mongoose.trusted({ $in: songIds }) })
    .lean<Array<SongPersistenceRecord & { _id: unknown }>>()
    .exec();

  return songs.map(toSongRecord);
}

export async function isSongFavorited(userId: string, songId: string): Promise<boolean> {
  const favorite = await FavoriteModel.findOne({ userId, songId }).exec();
  return !!favorite;
}
