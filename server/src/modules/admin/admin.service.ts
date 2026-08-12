import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import type {
  AdminCommunitySubmissionsResponse,
  AdminSongCreateRequest,
  AdminSongRecord,
  AdminSongsResponse,
  AdminStats,
  AdminUserRecord,
  AdminUsersResponse,
  CommunityCommentRecord,
  CommunitySubmissionRecord,
  PaginationMeta,
  ProfileAccent
} from '../../../../shared/types.js';
import { PROFILE_ACCENTS } from '../../../../shared/types.js';
import { UserModel, type UserDocument } from '../auth/user.model.js';
import { SongModel, type SongPersistenceRecord } from '../songs/song.model.js';
import { FavoriteModel } from '../songs/favorite.model.js';
import {
  CommunitySubmissionModel,
  CommunityCommentModel,
  type CommunitySubmissionPersistenceRecord,
  type CommunityCommentPersistenceRecord
} from '../community/community.model.js';
import { validatePassword } from '../auth/auth.service.js';

type HttpError = Error & { statusCode?: number };

function httpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePage(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function parseLimit(value: unknown, fallback = 20): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 100);
}

function isProfileAccent(value: unknown): value is ProfileAccent {
  return typeof value === 'string' && (PROFILE_ACCENTS as readonly string[]).includes(value);
}

// ── User Mapping ────────────────────────────────────────────

function toAdminUserRecord(user: UserDocument): AdminUserRecord {
  const accentKey = isProfileAccent(user.accentKey) ? user.accentKey : 'default';

  // Determine authProvider: google users → 'google', desktop guests → 'guest', web local → 'local'
  let authProvider: 'google' | 'guest' | 'local' = 'local';
  if (user.googleId) {
    authProvider = 'google';
  } else if (user.source === 'desktop') {
    authProvider = 'guest';
  }

  return {
    about: typeof user.about === 'string' && user.about.trim() ? user.about.trim() : null,
    accentKey,
    authProvider,
    source: user.source ?? 'web',
    deviceId: user.deviceId ?? null,
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    firstName: user.firstName ?? null,
    id: String(user._id),
    lastName: user.lastName ?? null,
    lockoutUntil: user.lockoutUntil ? user.lockoutUntil.toISOString() : null,
    profileImage: user.profileImage ?? null,
    role: user.role ?? 'user',
    tagline: typeof user.tagline === 'string' && user.tagline.trim() ? user.tagline.trim() : null,
    updatedAt: user.updatedAt.toISOString(),
    username: user.username ?? null
  };
}

// ── Song Mapping ────────────────────────────────────────────

function toAdminSongRecord(
  song: SongPersistenceRecord & { _id: unknown },
  favoriteCount: number
): AdminSongRecord {
  return {
    'About Song': song['About Song'] ?? '',
    'Direct to YT': song['Direct to YT'] ?? '',
    'Released Date': song['Released Date'] ?? '',
    'Song Title': song['Song Title'],
    Artist: song.Artist,
    Lyric: Array.isArray(song.Lyric) ? song.Lyric : [],
    _id: String(song._id),
    albumCover: song.albumCover ?? 'images/music-logo.jpg',
    category: song.category,
    favoriteCount,
    lyricLineCount: Array.isArray(song.Lyric) ? song.Lyric.length : 0,
    status: song.status ?? 'published'
  };
}

// ── Community Mapping ───────────────────────────────────────

function toCommunitySubmissionRecord(
  record: CommunitySubmissionPersistenceRecord & { _id: unknown }
): CommunitySubmissionRecord {
  return {
    _id: String(record._id),
    artist: record.artist,
    author: {
      id: String(record.authorId),
      label: record.authorLabel,
      profileImage: record.authorProfileImage ?? null,
      role: record.authorRole
    },
    commentCount: record.commentCount,
    createdAt: record.createdAt.toISOString(),
    description: record.description,
    lyrics: Array.isArray(record.lyrics) ? record.lyrics : [],
    releasedDate: record.releasedDate,
    status: record.status,
    title: record.title,
    youtubeUrl: record.youtubeUrl
  };
}

function toCommunityCommentRecord(
  record: CommunityCommentPersistenceRecord & { _id: unknown }
): CommunityCommentRecord {
  return {
    _id: String(record._id),
    author: {
      id: String(record.authorId),
      label: record.authorLabel,
      profileImage: record.authorProfileImage ?? null,
      role: record.authorRole
    },
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    submissionId: String(record.submissionId)
  };
}

// ── Pagination Helper ───────────────────────────────────────

function buildPagination(totalItems: number, page: number, limit: number): PaginationMeta {
  return {
    limit,
    page,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit))
  };
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalSongs,
    totalCommunityPosts,
    totalCommunityComments,
    totalFavorites,
    recentUsers,
    recentPosts,
    allUsers
  ] = await Promise.all([
    UserModel.countDocuments().exec(),
    SongModel.countDocuments({ status: mongoose.trusted({ $ne: 'removed' }) }).exec(),
    CommunitySubmissionModel.countDocuments().exec(),
    CommunityCommentModel.countDocuments().exec(),
    FavoriteModel.countDocuments().exec(),
    UserModel.countDocuments({ createdAt: mongoose.trusted({ $gte: sevenDaysAgo }) }).exec(),
    CommunitySubmissionModel.countDocuments({ createdAt: mongoose.trusted({ $gte: sevenDaysAgo }) }).exec(),
    UserModel.find().select('role googleId').lean().exec()
  ]);

  const usersByRole: Record<string, number> = { admin: 0, member: 0, moderator: 0, user: 0 };
  const usersByProvider: Record<string, number> = { google: 0, local: 0 };

  for (const user of allUsers) {
    const role = (user as { role?: string }).role ?? 'user';
    const hasGoogle = !!(user as { googleId?: string }).googleId;
    usersByRole[role] = (usersByRole[role] ?? 0) + 1;
    usersByProvider[hasGoogle ? 'google' : 'local'] = (usersByProvider[hasGoogle ? 'google' : 'local'] ?? 0) + 1;
  }

  return {
    recentPosts,
    recentUsers,
    totalCommunityComments,
    totalCommunityPosts,
    totalFavorites,
    totalSongs,
    totalUsers,
    usersByProvider,
    usersByRole
  };
}

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function listUsers(query: {
  limit?: unknown;
  page?: unknown;
  role?: unknown;
  search?: unknown;
}): Promise<AdminUsersResponse> {
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (typeof query.search === 'string' && query.search.trim()) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { username: regex },
      { displayName: regex },
      { firstName: regex },
      { lastName: regex },
      { email: regex }
    ];
  }

  if (typeof query.role === 'string' && ['admin', 'member', 'moderator', 'user'].includes(query.role)) {
    filter.role = query.role;
  }

  const [users, totalItems] = await Promise.all([
    UserModel.find(mongoose.trusted(filter))
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    UserModel.countDocuments(mongoose.trusted(filter)).exec()
  ]);

  return {
    pagination: buildPagination(totalItems, page, limit),
    success: true,
    users: users.map(toAdminUserRecord)
  };
}

export async function getUserDetail(userId: string): Promise<AdminUserRecord> {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError('Invalid user identifier.', 400);
  }

  const user = await UserModel.findById(userId).select('-password').exec();

  if (!user) {
    throw httpError('User not found.', 404);
  }

  const [favoriteCount, communityPostCount, communityCommentCount] = await Promise.all([
    FavoriteModel.countDocuments({ userId: String(user._id) }).exec(),
    CommunitySubmissionModel.countDocuments({ authorId: user._id }).exec(),
    CommunityCommentModel.countDocuments({ authorId: user._id }).exec()
  ]);

  const record = toAdminUserRecord(user);
  record.favoriteCount = favoriteCount;
  record.communityPostCount = communityPostCount;
  record.communityCommentCount = communityCommentCount;

  return record;
}

export async function updateUserRole(
  userId: string,
  newRole: string,
  adminUser: UserDocument
): Promise<AdminUserRecord> {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError('Invalid user identifier.', 400);
  }

  if (!['admin', 'member', 'moderator', 'user'].includes(newRole)) {
    throw httpError('Invalid role value.', 400);
  }

  if (String(adminUser._id) === userId) {
    throw httpError('Cannot change your own role.', 400);
  }

  const user = await UserModel.findById(userId).select('-password').exec();

  if (!user) {
    throw httpError('User not found.', 404);
  }

  user.role = newRole as 'admin' | 'member' | 'moderator' | 'user';
  await user.save();

  return toAdminUserRecord(user);
}

export async function unlockUser(userId: string): Promise<AdminUserRecord> {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError('Invalid user identifier.', 400);
  }

  const user = await UserModel.findById(userId).select('-password').exec();

  if (!user) {
    throw httpError('User not found.', 404);
  }

  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  await user.save();

  return toAdminUserRecord(user);
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<AdminUserRecord> {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError('Invalid user identifier.', 400);
  }

  const passwordValidation = validatePassword(newPassword);

  if (!passwordValidation.valid) {
    throw httpError(passwordValidation.errors.join(' '), 400);
  }

  const user = await UserModel.findById(userId).exec();

  if (!user) {
    throw httpError('User not found.', 404);
  }

  if (user.googleId && !user.password) {
    throw httpError('Cannot set password for a Google-only account.', 400);
  }

  user.password = bcrypt.hashSync(newPassword, 12);
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  await user.save();

  return toAdminUserRecord(user);
}

export async function deleteUser(
  userId: string,
  adminUser: UserDocument
): Promise<{ commentsRemoved: number; favoritesRemoved: number; postsRemoved: number; userId: string }> {
  if (!mongoose.isValidObjectId(userId)) {
    throw httpError('Invalid user identifier.', 400);
  }

  if (String(adminUser._id) === userId) {
    throw httpError('Cannot delete your own account.', 400);
  }

  const user = await UserModel.findById(userId).exec();

  if (!user) {
    throw httpError('User not found.', 404);
  }

  const [favResult, postResult, commentResult] = await Promise.all([
    FavoriteModel.deleteMany({ userId: String(user._id) }).exec(),
    CommunitySubmissionModel.deleteMany({ authorId: user._id }).exec(),
    CommunityCommentModel.deleteMany({ authorId: user._id }).exec()
  ]);

  await user.deleteOne();

  return {
    commentsRemoved: commentResult.deletedCount ?? 0,
    favoritesRemoved: favResult.deletedCount ?? 0,
    postsRemoved: postResult.deletedCount ?? 0,
    userId
  };
}

// ─────────────────────────────────────────────────────────────
// SONG MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function listSongsAdmin(query: {
  limit?: unknown;
  page?: unknown;
  search?: unknown;
  status?: unknown;
}): Promise<AdminSongsResponse> {
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (typeof query.search === 'string' && query.search.trim()) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ 'Song Title': regex }, { Artist: regex }];
  }

  if (typeof query.status === 'string' && ['published', 'removed'].includes(query.status)) {
    filter.status = query.status;
  }

  const [songs, totalItems] = await Promise.all([
    SongModel.find(mongoose.trusted(filter))
      .sort({ 'Song Title': 1 })
      .skip(skip)
      .limit(limit)
      .lean<Array<SongPersistenceRecord & { _id: unknown }>>()
      .exec(),
    SongModel.countDocuments(mongoose.trusted(filter)).exec()
  ]);

  const songIds = songs.map((song) => String(song._id));
  const favoriteCounts = await FavoriteModel.aggregate([
    { $match: { songId: { $in: songIds } } },
    { $group: { _id: '$songId', count: { $sum: 1 } } }
  ]).exec();

  const favoriteMap = new Map<string, number>();

  for (const entry of favoriteCounts) {
    favoriteMap.set(String(entry._id), entry.count);
  }

  return {
    pagination: buildPagination(totalItems, page, limit),
    songs: songs.map((song) => toAdminSongRecord(song, favoriteMap.get(String(song._id)) ?? 0)),
    success: true
  };
}

export async function getSongDetailAdmin(songId: string): Promise<AdminSongRecord> {
  if (!mongoose.isValidObjectId(songId)) {
    throw httpError('Invalid song identifier.', 400);
  }
  const song = await SongModel.findById(songId)
    .lean<SongPersistenceRecord & { _id: unknown }>()
    .exec();
  if (!song) {
    throw httpError('Song not found.', 404);
  }
  const favoriteCount = await FavoriteModel.countDocuments({ songId }).exec();
  return toAdminSongRecord(song, favoriteCount);
}

export async function createSong(payload: AdminSongCreateRequest): Promise<AdminSongRecord> {
  const title = typeof payload['Song Title'] === 'string' ? payload['Song Title'].trim() : '';
  const artist = typeof payload.Artist === 'string' ? payload.Artist.trim() : '';

  if (!title) throw httpError('Song Title is required.', 400);
  if (!artist) throw httpError('Artist is required.', 400);

  const song = await SongModel.create({
    'About Song': typeof payload['About Song'] === 'string' ? payload['About Song'].trim() : '',
    'Direct to YT': typeof payload['Direct to YT'] === 'string' ? payload['Direct to YT'].trim() : '',
    'Released Date': typeof payload['Released Date'] === 'string' ? payload['Released Date'].trim() : '',
    'Song Title': title,
    Artist: artist,
    Lyric: Array.isArray(payload.Lyric) ? payload.Lyric : [],
    albumCover: typeof payload.albumCover === 'string' ? payload.albumCover.trim() : 'images/music-logo.jpg',
    status: 'removed'
  });

  return toAdminSongRecord(song.toObject(), 0);
}

export async function updateSong(
  songId: string,
  payload: Partial<AdminSongCreateRequest>
): Promise<AdminSongRecord> {
  if (!mongoose.isValidObjectId(songId)) {
    throw httpError('Invalid song identifier.', 400);
  }

  const song = await SongModel.findById(songId).exec();

  if (!song) {
    throw httpError('Song not found.', 404);
  }

  if (typeof payload['Song Title'] === 'string' && payload['Song Title'].trim()) {
    song.set('Song Title', payload['Song Title'].trim());
  }

  if (typeof payload.Artist === 'string' && payload.Artist.trim()) {
    song.Artist = payload.Artist.trim();
  }

  if (typeof payload['Released Date'] === 'string') {
    song.set('Released Date', payload['Released Date'].trim());
  }

  if (typeof payload['About Song'] === 'string') {
    song.set('About Song', payload['About Song'].trim());
  }

  if (typeof payload['Direct to YT'] === 'string') {
    song.set('Direct to YT', payload['Direct to YT'].trim());
  }

  if (Array.isArray(payload.Lyric)) {
    song.Lyric = payload.Lyric;
  }

  if (typeof payload.albumCover === 'string') {
    song.albumCover = payload.albumCover.trim();
  }

  if (typeof (payload as any).status === 'string' && ['published', 'removed'].includes((payload as any).status)) {
    song.status = (payload as any).status;
  }

  await song.save();

  const favoriteCount = await FavoriteModel.countDocuments({ songId: String(song._id) }).exec();

  return toAdminSongRecord(song.toObject(), favoriteCount);
}

export async function deleteSong(songId: string): Promise<{ favoritesRemoved: number; songId: string }> {
  if (!mongoose.isValidObjectId(songId)) {
    throw httpError('Invalid song identifier.', 400);
  }

  const song = await SongModel.findById(songId).exec();

  if (!song) {
    throw httpError('Song not found.', 404);
  }

  song.status = 'removed';
  await song.save();

  return {
    favoritesRemoved: 0,
    songId
  };
}

// ─────────────────────────────────────────────────────────────
// COMMUNITY MODERATION
// ─────────────────────────────────────────────────────────────

export async function listCommunitySubmissionsAdmin(query: {
  limit?: unknown;
  page?: unknown;
  search?: unknown;
  status?: unknown;
}): Promise<AdminCommunitySubmissionsResponse> {
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (typeof query.search === 'string' && query.search.trim()) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ title: regex }, { artist: regex }, { authorLabel: regex }];
  }

  if (typeof query.status === 'string' && ['published', 'removed'].includes(query.status)) {
    filter.status = query.status;
  }

  const [submissions, totalItems] = await Promise.all([
    CommunitySubmissionModel.find(mongoose.trusted(filter))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<Array<CommunitySubmissionPersistenceRecord & { _id: unknown }>>()
      .exec(),
    CommunitySubmissionModel.countDocuments(mongoose.trusted(filter)).exec()
  ]);

  return {
    pagination: buildPagination(totalItems, page, limit),
    submissions: submissions.map(toCommunitySubmissionRecord),
    success: true
  };
}

export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: string
): Promise<CommunitySubmissionRecord> {
  if (!mongoose.isValidObjectId(submissionId)) {
    throw httpError('Invalid submission identifier.', 400);
  }

  if (!['published', 'removed'].includes(newStatus)) {
    throw httpError('Invalid status value.', 400);
  }

  const submission = await CommunitySubmissionModel.findById(submissionId).exec();

  if (!submission) {
    throw httpError('Community post not found.', 404);
  }

  submission.status = newStatus as 'published' | 'removed';
  await submission.save();

  return toCommunitySubmissionRecord(submission.toObject());
}

export async function updateCommentStatus(
  commentId: string,
  newStatus: string
): Promise<CommunityCommentRecord> {
  if (!mongoose.isValidObjectId(commentId)) {
    throw httpError('Invalid comment identifier.', 400);
  }

  if (!['published', 'removed'].includes(newStatus)) {
    throw httpError('Invalid status value.', 400);
  }

  const comment = await CommunityCommentModel.findById(commentId).exec();

  if (!comment) {
    throw httpError('Comment not found.', 404);
  }

  const previousStatus = comment.status;
  comment.status = newStatus as 'published' | 'removed';
  await comment.save();

  // Update commentCount on parent submission
  if (previousStatus !== newStatus) {
    const increment = newStatus === 'removed' ? -1 : 1;
    await CommunitySubmissionModel.updateOne(
      { _id: comment.submissionId },
      { $inc: { commentCount: increment } }
    ).exec();
  }

  return toCommunityCommentRecord(comment.toObject());
}
