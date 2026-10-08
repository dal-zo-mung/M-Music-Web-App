export const LIBRARY_PAGE_SIZE = 20;
export const LIBRARY_CATEGORIES = [
  { value: "", label: "All songs" },
  { value: "christmas", label: "Christmas songs" },
  { value: "worship", label: "Worship songs" },
  { value: "gospel", label: "Gospel songs" },
  { value: "hymns", label: "Hymns" },
];
export const LIBRARY_LANGUAGES = [
  { value: "", label: "ALL" },
  { value: "my", label: "Myan" },
  { value: "en", label: "English" },
] as const;

export interface LibraryState {
  q: string;
  category: string;
  language: "" | "my" | "en";
  page: number;
}

export function readLibraryState(params: URLSearchParams): LibraryState {
  let category = (params.get("category") ?? "").trim().toLowerCase();
  const rawLanguage = (params.get("language") ?? "").toLowerCase();
  let language: LibraryState["language"] = ["my", "myan", "myanmar"].includes(
    rawLanguage,
  )
    ? "my"
    : ["en", "english"].includes(rawLanguage)
      ? "en"
      : "";
  const legacy = /^(myanmar|english)-(christmas|worship|gospel|hymns)$/.exec(
    category,
  );
  if (legacy) {
    language ||= legacy[1] === "myanmar" ? "my" : "en";
    category = legacy[2];
  }
  if (category === "all") category = "";
  const page = Number(params.get("page") || "1");
  return {
    q: (params.get("q") ?? "").trim(),
    category,
    language,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function libraryParams(state: LibraryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.language) params.set("language", state.language);
  if (state.category) params.set("category", state.category);
  if (state.page > 1) params.set("page", String(state.page));
  return params;
}

export function buildLibraryPath(state: LibraryState): string {
  const query = libraryParams(state).toString();
  return query ? `/?${query}` : "/";
}

export function buildBrowseUrl(state: LibraryState, songId?: string): string {
  const params = libraryParams(state);
  params.set("limit", String(LIBRARY_PAGE_SIZE));
  if (songId) params.set("songId", songId);
  return `/api/songs/browse?${params}`;
}

export function buildLibrarySongPath(
  songId: string,
  state: LibraryState,
): string {
  const query = libraryParams(state).toString();
  return `/songs/${encodeURIComponent(songId)}${query ? `?${query}` : ""}`;
}
