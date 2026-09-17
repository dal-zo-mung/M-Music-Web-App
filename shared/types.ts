export const PROFILE_ACCENTS = [
  "default",
  "aurora",
  "ember",
  "meadow",
  "slate",
] as const;
export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];

export interface PublicUser {
  id: string;
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  authProvider: "google" | "local";
  role: "admin" | "member" | "moderator" | "user";
  createdAt: string;
  about: string | null;
  accentKey: ProfileAccent;
  /** Short public line under your name (e.g. favourite genre). */
  tagline: string | null;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: PublicUser;
}

export interface AuthMutationResponse {
  success: boolean;
  user?: PublicUser;
  message?: string;
  status?: number;
  error?: string;
  retryAfterSeconds?: number;
}

export interface SongRecord {
  _id: string;
  "Song Title": string;
  Artist: string;
  "Released Date": string;
  "About Song": string;
  "Direct to YT": string;
  Lyric: string[];
  albumCover: string;
  /** Category slug, e.g. "myanmar-worship", "english-hymns" */
  category?: string;
}

export interface FavoriteResponse {
  isFavorited: boolean;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  error: string;
  message?: string;
  stack?: string;
}

export interface ProfileUpdateRequest {
  about?: string;
  accentKey?: ProfileAccent;
  displayName?: string | null;
  firstName?: string;
  lastName?: string;
  tagline?: string;
}

export interface SupportChatRequest {
  messages: Array<{ content: string; role: "assistant" | "user" }>;
}

export interface SupportChatResponse {
  reply: string;
  stub: boolean;
}

// ── Admin Types ──────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalSongs: number;
  totalFavorites: number;
  recentUsers: number;
  recentPosts: number;
  usersByRole: Record<string, number>;
  usersByProvider: Record<string, number>;
}

export interface AdminStatsResponse {
  success: true;
  stats: AdminStats;
}

export interface AdminUserRecord {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "admin" | "member" | "moderator" | "user";
  authProvider: "google" | "guest" | "local";
  source: "desktop" | "web";
  deviceId: string | null;
  profileImage: string | null;
  about: string | null;
  tagline: string | null;
  accentKey: ProfileAccent;
  createdAt: string;
  updatedAt: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
  favoriteCount?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  success: true;
  users: AdminUserRecord[];
  pagination: PaginationMeta;
}

export interface AdminUserDetailResponse {
  success: true;
  user: AdminUserRecord;
}

export interface AdminRoleUpdateRequest {
  role: "admin" | "member" | "moderator" | "user";
}

export interface AdminPasswordResetRequest {
  password: string;
}

export interface AdminSongRecord extends SongRecord {
  status: "published" | "removed";
  lyricLineCount: number;
  favoriteCount: number;
}

export interface AdminSongsResponse {
  success: true;
  songs: AdminSongRecord[];
  pagination: PaginationMeta;
}

export interface AdminSongCreateRequest {
  "Song Title": string;
  Artist: string;
  "Released Date"?: string;
  "About Song"?: string;
  "Direct to YT"?: string;
  Lyric?: string[];
  albumCover?: string;
  /** Category slug, e.g. "myanmar-worship", "english-hymns" */
  category?: string;
}

export interface AdminStatusUpdateRequest {
  status: "published" | "removed";
}

// ── Desktop Module Types ──────────────────────────────────────

export interface LyricSlideBlock {
  id: string;
  type: "verse" | "chorus" | "bridge" | "blank";
  label: string;
  lines: string[];
}

export interface LyricsJson {
  slides: LyricSlideBlock[];
}

export interface DesktopSong {
  id: string;
  title: string;
  artist?: string;
  language: string;
  category: string;
  lyrics_json: LyricsJson;
  thumbnail_color?: string;
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface DesktopCategory {
  id: string;
  name: string;
  language?: string;
  song_count: number;
}

export type ReleasePlatform = "win" | "mac" | "linux" | "all";

export interface Release {
  id: string;
  version: string;
  release_notes?: string | null;
  platform: ReleasePlatform;
  download_url: string;
  is_active: boolean;
  created_at: string;
}

export type LegalDocType = "terms" | "privacy" | "copyright";

export interface LegalDocument {
  id: string;
  type: LegalDocType;
  title: string;
  content: string;
  updated_at: string;
}

// Public API responses
export interface DesktopSongsPublicResponse {
  songs: DesktopSong[];
}

export interface DesktopCategoriesPublicResponse {
  categories: DesktopCategory[];
}

export interface DesktopLatestReleaseResponse {
  release: Release | null;
}

export interface DesktopLegalResponse {
  document: LegalDocument;
}

export interface DesktopCheckUpdatesRequest {
  songs: Array<{ id: string; updated_at: string | null }>;
}

export interface DesktopCheckUpdatesResponse {
  results: Array<{ id: string; hasUpdate: boolean }>;
}

// Admin API responses
export interface AdminDesktopSongsResponse {
  songs: DesktopSong[];
  pagination: PaginationMeta;
}

export interface AdminDesktopCategoriesResponse {
  categories: DesktopCategory[];
  success: true;
}

export interface AdminReleasesResponse {
  releases: Release[];
  success: true;
}

export interface AdminLegalResponse {
  documents: LegalDocument[];
  success: true;
}

// Admin request bodies
export interface AdminDesktopSongCreateRequest {
  title: string;
  artist?: string;
  language: string;
  category: string;
  lyrics_json: LyricsJson;
  thumbnail_color?: string;
}

export interface AdminDesktopSongPublishRequest {
  is_published: boolean;
}

export interface AdminCategoryCreateRequest {
  name: string;
  language?: string;
}

export interface AdminReleaseCreateRequest {
  version: string;
  release_notes?: string;
  platform: ReleasePlatform;
  download_url: string;
}

export interface AdminLegalUpsertRequest {
  title: string;
  content: string;
}

// ── Desktop Auth Types ────────────────────────────────────────

export interface DesktopUserProfile {
  id: string;
  authMethod: "google" | "guest";
  email: string | null;
  displayName: string | null;
  profileImage: string | null;
}

export interface DesktopAuthGuestRequest {
  deviceId: string;
}

export interface DesktopAuthGuestResponse {
  success: true;
  user: DesktopUserProfile;
}

export interface DesktopAuthGoogleInitResponse {
  success: true;
  authUrl: string;
  token: string;
}

export interface DesktopAuthGooglePollResponse {
  status: "pending" | "complete";
  user?: DesktopUserProfile;
}

export interface DesktopAuthLinkGoogleRequest {
  deviceId: string;
}

export interface DesktopAuthMeResponse {
  success: true;
  user: DesktopUserProfile | null;
}
