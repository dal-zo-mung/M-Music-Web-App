import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { SongBrowseResponse, SongRecord } from "@shared/types";
import { requestJson } from "../lib/api";
import {
  buildBrowseUrl,
  buildLibraryPath,
  buildLibrarySongPath,
  type LibraryState,
} from "../lib/library";
import "../styles/lyrics-song-search.css";

const SEARCH_DELAY = 300;
const SUGGESTION_LIMIT = 8;

interface SearchResult {
  query: string;
  data?: SongBrowseResponse;
  error?: string;
  loading: boolean;
}

function searchState(query: string, page = 1): LibraryState {
  return { q: query, category: "", language: "", page };
}

export function LyricsSongSearch({
  songId,
}: {
  songId: string;
}): React.JSX.Element {
  const location = useLocation();
  // A new reader visit includes selecting the current song again.
  return <LyricsSongSearchInput key={`${songId}:${location.key}`} />;
}

function LyricsSongSearchInput(): React.JSX.Element {
  const navigate = useNavigate();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SearchResult>({
    query: "",
    loading: false,
  });
  const trimmedDraft = draft.trim();
  const showDropdown = open && Boolean(trimmedDraft);
  const isCurrentResult = result.query === trimmedDraft && !isComposing;
  const loading = Boolean(trimmedDraft) && (!isCurrentResult || result.loading);
  const data = isCurrentResult && !loading ? result.data : undefined;
  const error = isCurrentResult && !loading ? result.error : undefined;
  const songs = data?.songs.slice(0, SUGGESTION_LIMIT) ?? [];
  const listId = `${id}-options`;
  const statusId = `${id}-status`;

  useEffect(() => {
    if (isComposing || trimmedDraft === query) return;
    const timer = window.setTimeout(() => setQuery(trimmedDraft), SEARCH_DELAY);
    return () => window.clearTimeout(timer);
  }, [trimmedDraft, query, isComposing]);

  useEffect(() => {
    if (!query) {
      setResult({ query: "", loading: false });
      return;
    }
    const controller = new AbortController();
    setResult({ query, loading: true });
    void requestJson<SongBrowseResponse>(buildBrowseUrl(searchState(query)), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted)
          setResult({ query, data: response, loading: false });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            query,
            error: error instanceof Error ? error.message : "Please try again.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [query, attempt]);

  useEffect(() => {
    if (!showDropdown) return;
    function outside(event: PointerEvent): void {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [showDropdown]);

  useEffect(() => {
    if (activeIndex >= 0 && showDropdown)
      document
        .getElementById(`${id}-option-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showDropdown, id]);

  function selectSong(song: SongRecord): void {
    setOpen(false);
    navigate(
      buildLibrarySongPath(
        song._id,
        searchState(trimmedDraft, data?.pagination.page ?? 1),
      ),
    );
  }

  function searchNow(): void {
    if (composing.current) return;
    setOpen(true);
    setQuery(trimmedDraft);
  }

  const status = loading
    ? "Searching songs…"
    : error
      ? "Couldn’t search songs."
      : data
        ? data.counts.found
          ? `${data.counts.found.toLocaleString()} matching ${data.counts.found === 1 ? "song" : "songs"}`
          : "No songs found. Try another title, artist or lyric."
        : "";

  return (
    <div
      className="lyrics-song-search"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        aria-label="Find another song"
        onSubmit={(event) => {
          event.preventDefault();
          searchNow();
        }}
      >
        <label htmlFor={`${id}-input`}>Find another song</label>
        <div className="lyrics-song-search__field">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            ref={input}
            id={`${id}-input`}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listId : undefined}
            aria-describedby={`${id}-hint`}
            aria-activedescendant={
              showDropdown && songs[activeIndex]
                ? `${id}-option-${activeIndex}`
                : undefined
            }
            placeholder="Search by title, artist or lyrics ..."
            autoComplete="off"
            maxLength={100}
            value={draft}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setDraft(event.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onCompositionStart={() => {
              composing.current = true;
              setIsComposing(true);
            }}
            onCompositionEnd={() => {
              composing.current = false;
              setIsComposing(false);
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || composing.current) return;
              if (event.key === "Escape") {
                if (showDropdown) event.preventDefault();
                setOpen(false);
                setActiveIndex(-1);
              } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                if (songs.length)
                  setActiveIndex((index) => {
                    if (!showDropdown || index < 0)
                      return event.key === "ArrowDown" ? 0 : songs.length - 1;
                    return (
                      (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        songs.length) %
                      songs.length
                    );
                  });
              } else if (
                event.key === "Enter" &&
                showDropdown &&
                songs[activeIndex]
              ) {
                event.preventDefault();
                selectSong(songs[activeIndex]);
              }
            }}
          />
          {draft && (
            <button
              className="lyrics-song-search__clear"
              type="button"
              aria-label="Clear song search"
              onClick={() => {
                setDraft("");
                setQuery("");
                setActiveIndex(-1);
                input.current?.focus();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          )}
        </div>
      </form>
      <span className="visually-hidden" role="status" aria-live="polite">
        {showDropdown ? status : ""}
      </span>
      {showDropdown && (
        <div className="lyrics-song-search__dropdown">
          <p className="lyrics-song-search__status" id={statusId}>
            {status}
          </p>
          {error && (
            <div className="lyrics-song-search__error">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching songs"
            aria-busy={loading}
            aria-describedby={statusId}
            className="lyrics-song-search__options"
          >
            {songs.map((song, index) => (
              <li
                key={song._id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => selectSong(song)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 18V5l11-2v13M9 9l11-2" />
                  <ellipse cx="6" cy="18" rx="3" ry="2.5" />
                  <ellipse cx="17" cy="16" rx="3" ry="2.5" />
                </svg>
                <span>
                  <span className="lyrics-song-search__title">
                    {song["Song Title"] || "Untitled song"}
                  </span>
                  {song.Artist && (
                    <span className="lyrics-song-search__artist">
                      {song.Artist}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {data && data.counts.found > songs.length && (
            <Link
              className="lyrics-song-search__all"
              to={buildLibraryPath(searchState(trimmedDraft))}
            >
              See all {data.counts.found.toLocaleString()} matching songs →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
