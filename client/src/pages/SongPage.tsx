import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import useSWR from "swr";

import type { FavoriteResponse, SongRecord } from "@shared/types";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { MenuPanel } from "../components/MenuPanel";
import { ReaderIcon } from "../components/ReaderIcon";
import { LyricsSongSearch } from "../components/LyricsSongSearch";
import { formatLyrics } from "../lib/auth";
import {
  getRandomSongDetailColorIndex,
  getSongDetailCardColor,
} from "../lib/songDetailCard";
import { startLyricsAutoScroll } from "../lib/lyricsAutoScroll";
import { useSongNavigation } from "../lib/useSongNavigation";
import { deleteJson, fetchJson, postJson } from "../lib/api";
import "../styles/song-page.css";

const DEFAULT_COVER = "/images/music-logo.jpg";

function normalizeCoverPath(value: string): string {
  const cover = value.trim().replace(/\\/g, "/");
  if (!cover || /^\/?images\/(default|music-logo)\.jpg$/i.test(cover))
    return DEFAULT_COVER;
  return /^[a-z][a-z\d+.-]*:/i.test(cover) || cover.startsWith("/")
    ? cover
    : `/${cover}`;
}

export function SongPage(): React.JSX.Element {
  const location = useLocation();
  return <SongReader key={location.key} />;
}

function SongReader(): React.JSX.Element {
  const [detailColorIndex] = useState(() => getRandomSongDetailColorIndex());
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const { songId = "" } = useParams();
  const navigate = useNavigate();
  const preferences = usePreferences();
  const { scrollSpeed, theme } = preferences;
  const navigation = useSongNavigation(songId);
  const { currentUser, isLoading: authLoading } = useAuth();
  const {
    data: song,
    isLoading,
    error: songError,
    mutate: reloadSong,
  } = useSWR<SongRecord>(songId ? `/api/songs/${songId}` : null, fetchJson);
  const { data: favoriteState, mutate: mutateFavorite } =
    useSWR<FavoriteResponse>(
      currentUser && songId ? `/api/songs/${songId}/favorite` : null,
      fetchJson,
    );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    lyricsRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setIsAutoScrollEnabled(false);
    setSettingsOpen(false);
  }, [songId]);

  useEffect(() => {
    if (!settingsOpen) return undefined;

    function outside(event: PointerEvent): void {
      if (
        event.target instanceof Node &&
        !settingsRef.current?.contains(event.target)
      ) {
        setSettingsOpen(false);
      }
    }

    function escape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        settingsButton.current?.focus();
      }
    }

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (!isAutoScrollEnabled) {
      return undefined;
    }

    const lyricsContainer = lyricsRef.current;
    if (!lyricsContainer || !song) {
      return undefined;
    }
    return startLyricsAutoScroll(lyricsContainer, scrollSpeed, () =>
      setIsAutoScrollEnabled(false),
    );
  }, [isAutoScrollEnabled, scrollSpeed, song]);

  async function toggleFavorite(): Promise<void> {
    if (!songId || !song) {
      return;
    }

    if (!currentUser) {
      navigate(`/login?returnTo=${encodeURIComponent(navigation.songPath)}`);
      return;
    }

    setIsTogglingFavorite(true);

    try {
      if (favoriteState?.isFavorited) {
        await deleteJson(`/api/songs/${songId}/favorite`);
      } else {
        await postJson(`/api/songs/${songId}/favorite`);
      }

      await mutateFavorite();
    } catch {
      window.alert("Unable to update saved song. Please try again.");
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  if (songError || (!isLoading && !song)) {
    return (
      <main className="song-page">
        <div className="song-library-back">
          <Link to={navigation.backPath}>← Back to songs</Link>
        </div>
        <div className="library-message" role="alert">
          <h1>Couldn’t open this song</h1>
          <p>
            {songError instanceof Error
              ? songError.message
              : "This song is no longer available."}
          </p>
          <button type="button" onClick={() => void reloadSong()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="song-page">
      <div className="song-library-back">
        <Link to={navigation.backPath}>← Back to songs</Link>
      </div>
      <LyricsSongSearch songId={songId} />
      <section className="song-page__stack">
        <article
          className="song-card"
          style={{
            backgroundColor: getSongDetailCardColor(
              detailColorIndex,
              theme === "dark",
            ),
            color: theme === "dark" ? "#F4F7FA" : "#111827",
          }}
        >
          <div className="song-card__cover-wrap">
            {isLoading ? <div className="loading-overlay" /> : null}
            <img
              alt={song ? `${song["Song Title"]} album cover` : "Album cover"}
              className="song-card__cover"
              src={song ? normalizeCoverPath(song.albumCover) : DEFAULT_COVER}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_COVER;
              }}
            />
          </div>

          <div className="song-card__meta">
            <h1>{song?.["Song Title"] ?? "Loading..."}</h1>
            <p className="song-card__artist">
              {song?.Artist ? `Artist: ${song.Artist}` : "-"}
            </p>
            <p className="muted-copy">
              {song?.["Released Date"]
                ? `Released: ${song["Released Date"]}`
                : "-"}
            </p>
            <p className="muted-copy">{song?.["About Song"] || "-"}</p>
            <a
              className="text-link"
              href={song?.["Direct to YT"] || "#"}
              rel="noreferrer"
              target="_blank"
            >
              Watch on YouTube
            </a>
          </div>
        </article>

        <article className="lyrics-card">
          <div className="lyrics-card__header">
            <p className="section-eyebrow">Lyrics</p>
            <div
              className="library-display-settings lyrics-card__settings"
              ref={settingsRef}
            >
              <button
                ref={settingsButton}
                type="button"
                className="library-settings-button"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                aria-label="Lyrics display settings"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <ReaderIcon name="text" />
                <span>Reading settings</span>
              </button>
              <MenuPanel
                {...preferences}
                isOpen={settingsOpen}
                showSongControls
                showThemeControls={false}
              />
            </div>
          </div>

          <div className="lyrics-card__actions">
            <button
              className="button button--secondary"
              aria-pressed={favoriteState?.isFavorited ?? false}
              disabled={isLoading || authLoading || isTogglingFavorite}
              type="button"
              onClick={toggleFavorite}
            >
              <ReaderIcon name="bookmark" />
              {favoriteState?.isFavorited ? "Saved" : "Save song"}
            </button>
            <div className="lyrics-card__transport">
              <button
                className="icon-button icon-button--ghost"
                type="button"
                aria-label="Previous song"
                disabled={!navigation.canNavigate}
                onClick={() => void navigation.navigateRelative(-1)}
              >
                <ReaderIcon name="previous" />
              </button>
              <button
                className="icon-button icon-button--ghost"
                type="button"
                aria-label="Next song"
                disabled={!navigation.canNavigate}
                onClick={() => void navigation.navigateRelative(1)}
              >
                <ReaderIcon name="next" />
              </button>
              <button
                className="button button--secondary"
                aria-pressed={isAutoScrollEnabled}
                aria-controls="lyrics-container"
                disabled={isLoading || !song}
                type="button"
                onClick={() => {
                  if (!isAutoScrollEnabled && lyricsRef.current) {
                    const container = lyricsRef.current;
                    if (
                      container.scrollTop >=
                      container.scrollHeight - container.clientHeight - 1
                    ) {
                      container.scrollTo({ top: 0, behavior: "instant" });
                    }
                  }
                  setIsAutoScrollEnabled((currentValue) => !currentValue);
                }}
              >
                <ReaderIcon name={isAutoScrollEnabled ? "pause" : "play"} />
                {isAutoScrollEnabled ? "Pause scrolling" : "Auto-scroll"}
              </button>
            </div>
          </div>

          {navigation.navigationError && (
            <p className="song-navigation-error" role="status">
              {navigation.navigationError}{" "}
              <button type="button" onClick={navigation.retryNavigation}>
                Retry
              </button>
            </p>
          )}
          <div
            className="lyrics-card__body"
            id="lyrics-container"
            ref={lyricsRef}
            tabIndex={0}
            role="region"
            aria-label="Song lyrics"
            onWheel={() => setIsAutoScrollEnabled(false)}
            onTouchStart={() => setIsAutoScrollEnabled(false)}
            onPointerDown={() => setIsAutoScrollEnabled(false)}
            onKeyDown={(event) => {
              if (
                [
                  "ArrowUp",
                  "ArrowDown",
                  "PageUp",
                  "PageDown",
                  "Home",
                  "End",
                  " ",
                ].includes(event.key)
              )
                setIsAutoScrollEnabled(false);
            }}
          >
            <pre className="lyrics-card__text">
              {song ? formatLyrics(song.Lyric) : "Loading lyrics..."}
            </pre>
          </div>
        </article>
      </section>
    </main>
  );
}
