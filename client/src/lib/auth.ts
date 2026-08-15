import type { Location } from "react-router-dom";

const MAX_PASSWORD_LENGTH = 128;

export interface PasswordValidationResult {
  errors: string[];
  valid: boolean;
}

export function validatePassword(password: string): PasswordValidationResult {
  const rules = [
    {
      test: (candidate: string) => candidate.length >= 8,
      message: "At least 8 characters",
    },
    {
      test: (candidate: string) => candidate.length <= MAX_PASSWORD_LENGTH,
      message: `No more than ${MAX_PASSWORD_LENGTH} characters`,
    },
    {
      test: (candidate: string) => /[A-Z]/.test(candidate),
      message: "At least one uppercase letter",
    },
    {
      test: (candidate: string) => /[a-z]/.test(candidate),
      message: "At least one lowercase letter",
    },
    {
      test: (candidate: string) => /[0-9]/.test(candidate),
      message: "At least one number",
    },
    {
      test: (candidate: string) =>
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(candidate),
      message: "At least one special character",
    },
  ];

  const errors = rules
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.message);

  return {
    errors,
    valid: errors.length === 0,
  };
}

export function buildSearchPath(query: string): string {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return "/search";
  }

  return `/search?q=${encodeURIComponent(trimmedQuery)}`;
}

export function buildSongPath(songId: string, query?: string): string {
  const params = new URLSearchParams();
  const trimmedQuery = query?.trim() ?? "";

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  const queryString = params.toString();
  return queryString ? `/songs/${songId}?${queryString}` : `/songs/${songId}`;
}

export function buildReturnTo(
  location: Pick<Location, "pathname" | "search">,
): string {
  return `${location.pathname}${location.search}`;
}

export function getReturnToParam(search: string): string {
  const params = new URLSearchParams(search);
  return params.get("returnTo") || "/";
}

export function safeRedirectPath(pathname: string): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/";
  }

  return pathname;
}

export function formatLyrics(lines: string[]): string {
  return Array.isArray(lines) ? lines.join("\n") : "";
}
