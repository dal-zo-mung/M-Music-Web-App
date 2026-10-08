import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import type { SongBrowseResponse } from "@shared/types";
import { LibraryFilters } from "../components/LibraryFilters";
import { fetchJson } from "../lib/api";
import {
  buildBrowseUrl,
  buildLibrarySongPath,
  libraryParams,
  readLibraryState,
  type LibraryState,
} from "../lib/library";

export function LibraryPage(): React.JSX.Element {
  const [params, setParams] = useSearchParams();
  const state = readLibraryState(params);
  const [draft, setDraft] = useState(state.q);
  const [composing, setComposing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<SongBrowseResponse>(buildBrowseUrl(state), fetchJson);

  useEffect(() => {
    setDraft(state.q);
  }, [state.q]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function update(changes: Partial<LibraryState>, replace = false): void {
    clearTimeout(timer.current);
    setParams(libraryParams({ ...state, page: 1, ...changes }), {
      replace,
      preventScrollReset: changes.page === undefined,
    });
  }

  useEffect(() => {
    if (composing || draft.trim() === state.q) return;
    timer.current = setTimeout(() => {
      setParams(libraryParams({ ...state, q: draft.trim(), page: 1 }), {
        replace: true,
        preventScrollReset: true,
      });
    }, 300);
    return () => clearTimeout(timer.current);
  }, [
    draft,
    composing,
    state.q,
    state.language,
    state.category,
    state.page,
    setParams,
  ]);

  useEffect(() => {
    if (data && data.pagination.page !== state.page) {
      setParams(libraryParams({ ...state, page: data.pagination.page }), {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [data, state.page, state.q, state.category, state.language, setParams]);

  return (
    <main className="library-page" id="main-content">
      <h1 className="visually-hidden">Song library</h1>
      <LibraryFilters
        state={state}
        onChange={(changes) => update({ q: draft.trim(), ...changes })}
      />
      <div className="library-content">
        <form
          className="library-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            update({ q: draft.trim() });
          }}
        >
          <div
            className="library-count"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>Found:</span>
            <strong
              aria-label={
                data
                  ? `${data.counts.found} of ${data.counts.total} songs`
                  : "Song count unavailable"
              }
            >
              <span>{data?.counts.found.toLocaleString() ?? "–"}</span>
              <span aria-hidden="true">/</span>
              <span>{data?.counts.total.toLocaleString() ?? "–"}</span>
            </strong>
          </div>
          <label className="visually-hidden" htmlFor="library-search-input">
            Search title, artist, or lyrics
          </label>
          <input
            id="library-search-input"
            type="search"
            placeholder="Search songs…"
            autoComplete="off"
            maxLength={100}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
          />
          <button className="library-search__button" type="submit">
            Search
          </button>
        </form>
        <section
          className="library-results"
          aria-label="Songs"
          aria-busy={isLoading || isValidating}
        >
          {error ? (
            <div className="library-message" role="alert">
              <h2>Couldn’t load songs</h2>
              <p>
                {error instanceof Error ? error.message : "Please try again."}
              </p>
              <button type="button" onClick={() => void mutate()}>
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div className="library-loading" role="status">
              <span className="visually-hidden">Loading songs…</span>
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  className="library-skeleton"
                  key={index}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : !data?.songs.length ? (
            <div className="library-message">
              <h2>No songs found</h2>
            </div>
          ) : (
            <ol
              className="library-song-list"
              start={(data.pagination.page - 1) * data.pagination.limit + 1}
            >
              {data.songs.map((song, index) => (
                <li className="library-song-row" key={song._id}>
                  <span className="library-song-number" aria-hidden="true">
                    {(data.pagination.page - 1) * data.pagination.limit +
                      index +
                      1}
                  </span>
                  <Link
                    className="library-song-link"
                    to={buildLibrarySongPath(song._id, {
                      ...state,
                      page: data.pagination.page,
                    })}
                  >
                    <span
                      className="library-song-title"
                      title={song["Song Title"]}
                    >
                      {song["Song Title"] || "Untitled song"}
                    </span>
                    {song.Artist && (
                      <span className="library-song-artist">{song.Artist}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
        {!error && data && data.pagination.totalPages > 1 && (
          <nav className="library-pagination" aria-label="Song pages">
            <button
              type="button"
              disabled={data.pagination.page <= 1}
              onClick={() => update({ page: data.pagination.page - 1 })}
            >
              ← Previous
            </button>
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => update({ page: data.pagination.page + 1 })}
            >
              Next →
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}
