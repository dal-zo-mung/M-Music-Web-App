import { Link, useSearchParams } from "react-router-dom";

import useSWR from "swr";

import type { SongRecord } from "@shared/types";

import { buildSongPath } from "../lib/auth";
import { fetchJson } from "../lib/api";

/** Human-readable labels for category slugs */
const CATEGORY_LABELS: Record<string, string> = {
  "myanmar-worship": "Myanmar Worship Songs",
  "english-worship": "English Worship Songs",
  "myanmar-gospel": "Myanmar Gospel Songs",
  "english-gospel": "English Gospel Songs",
  "myanmar-hymns": "Myanmar Hymns",
  "english-hymns": "English Hymns",
};

function buildSearchUrl(q: string, category: string): string | null {
  if (!q && !category) return null;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  params.set("limit", "50");
  return `/api/songs/search?${params.toString()}`;
}

export function SearchPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";

  const searchUrl = buildSearchUrl(query, category);
  const { data: songs, isLoading } = useSWR<SongRecord[]>(searchUrl, fetchJson);

  const searchResults = songs ?? [];
  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : "";

  function clearCategory(): void {
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    setSearchParams(next, { replace: true });
  }

  // heading copy
  let heading = "Find the song you want to open";
  if (categoryLabel && query) heading = `"${query}" in ${categoryLabel}`;
  else if (categoryLabel) heading = categoryLabel;
  else if (query) heading = `Results for "${query}"`;

  // sub-copy
  let subCopy = "Search by song title or artist to see matching results.";
  if (searchUrl && !isLoading) {
    subCopy = `${searchResults.length} ${searchResults.length === 1 ? "match" : "matches"} found.`;
  }

  return (
    <main className="search-page">
      <section className="search-shell">
        <div className="search-summary-card">
          <p className="section-eyebrow">Search Results</p>
          <h1>{heading}</h1>

          {/* Category chip */}
          {categoryLabel ? (
            <div className="category-filter-chip">
              <span className="category-filter-chip__label">
                {categoryLabel}
              </span>
              <button
                aria-label={`Clear ${categoryLabel} filter`}
                className="category-filter-chip__clear"
                type="button"
                onClick={clearCategory}
              >
                ×
              </button>
            </div>
          ) : null}

          <p>{subCopy}</p>
        </div>

        <div aria-live="polite" className="search-results">
          {isLoading ? (
            <p className="empty-panel">Searching for songs...</p>
          ) : null}

          {!isLoading && !searchUrl ? (
            <p className="empty-panel">
              Search by song title or artist, or pick a category above.
            </p>
          ) : null}

          {!isLoading && searchUrl && searchResults.length === 0 ? (
            <p className="empty-panel">
              {categoryLabel
                ? `No songs found in "${categoryLabel}"${query ? ` matching "${query}"` : ""}.`
                : `No results found for "${query}".`}
            </p>
          ) : null}

          {searchResults.map((song) => (
            <Link
              className="search-result-card"
              key={song._id}
              to={buildSongPath(song._id, query)}
            >
              <h2>{song["Song Title"] || "Untitled song"}</h2>
              <p>
                {[song.Artist, song["About Song"]].filter(Boolean).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
