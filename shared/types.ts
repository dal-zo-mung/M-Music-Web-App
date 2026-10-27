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
  chordChart?: import("@m-music/chord-core").ChordChart | null;
  _id: string;
  "Song Title": string;
  Artist: string;
  "Released Date": string;
  "About Song": string;
  "Direct to YT": string;
  Lyric: string[];
  albumCover: string;
  category?: string[];
  language?: "my" | "en";
}

export interface SongBrowseResponse {
  songs: SongRecord[];
  counts: { found: number; total: number };
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
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

export type ReleasePlatform = "win" | "mac" | "linux" | "all";

export interface Release {
  id: string;
  version: string;
  release_notes?: string | null;
  platform: ReleasePlatform;
  download_url: string;
  is_active: boolean;
  was_released?: boolean;
  released_at?: string | null;
  created_at: string;
}

export interface DesktopLatestReleaseResponse {
  release: Release | null;
}

export interface DesktopReleaseHistoryResponse {
  releases: Release[];
}
