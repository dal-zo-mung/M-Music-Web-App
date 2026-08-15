import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import useSWR from "swr";

import type { FavoriteResponse, SongRecord } from "@shared/types";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { buildSongPath, formatLyrics } from "../lib/auth";
import { deleteJson, fetchJson, postJson } from "../lib/api";

const DEFAULT_COVER = "/images/music-logo.jpg";

function getSongListUrl(query: string): string {
  return query
    ? `/api/songs/search/${encodeURIComponent(query)}?limit=50`
    : "/api/songs";
}

function normalizeCoverPath(value: string): string {
  return value.trim() ? value.replace(/\\/g, "/") : DEFAULT_COVER;
}

export function SongPage(): React.JSX.Element {
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
  const [searchParams] = useSearchParams();
  const { songId = "" } = useParams();
  const navigate = useNavigate();
  const { scrollSpeed } = usePreferences();
  const query = searchParams.get("q")?.trim() ?? "";
  const { currentUser, isLoading: authLoading } = useAuth();
  const { data: song, isLoading } = useSWR<SongRecord>(
    songId ? `/api/songs/${songId}` : null,
    fetchJson,
  );
  const { data: songs = [] } = useSWR<SongRecord[]>(
    getSongListUrl(query),
    fetchJson,
  );
  const { data: favoriteState, mutate: mutateFavorite } =
    useSWR<FavoriteResponse>(
      currentUser && songId ? `/api/songs/${songId}/favorite` : null,
      fetchJson,
    );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const currentIndex = useMemo(
    () => songs.findIndex((item) => item._id === songId),
    [songId, songs],
  );

  useEffect(() => {
    if (!isAutoScrollEnabled) {
      return undefined;
    }

    const lyricsContainer = document.getElementById("lyrics-container");

    if (!(lyricsContainer instanceof HTMLElement)) {
      return undefined;
    }

    const clampedSpeed = Math.max(1, Math.min(40, scrollSpeed));
    const step = 0.5 + ((clampedSpeed - 1) * 1) / 39;
    const interval = 300 - ((clampedSpeed - 1) * 140) / 39;

    const timer = window.setInterval(() => {
      lyricsContainer.scrollBy({ behavior: "smooth", left: 0, top: step });
    }, interval);

    return () => window.clearInterval(timer);
  }, [isAutoScrollEnabled, scrollSpeed]);

  useEffect(() => {
    function handleArrowNavigation(event: KeyboardEvent): void {
      if (!songs.length || currentIndex < 0) {
        return;
      }

      if (event.key === "ArrowLeft") {
        const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
        navigate(buildSongPath(songs[previousIndex]._id, query));
      }

      if (event.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % songs.length;
        navigate(buildSongPath(songs[nextIndex]._id, query));
      }
    }

    window.addEventListener("keydown", handleArrowNavigation);

    return () => {
      window.removeEventListener("keydown", handleArrowNavigation);
    };
  }, [currentIndex, navigate, query, songs]);

  function navigateRelative(offset: -1 | 1): void {
    if (!songs.length || currentIndex < 0) {
      return;
    }

    const nextIndex = (currentIndex + offset + songs.length) % songs.length;
    navigate(buildSongPath(songs[nextIndex]._id, query));
  }

  async function copyLyrics(): Promise<void> {
    if (!song) {
      return;
    }

    await navigator.clipboard.writeText(formatLyrics(song.Lyric));
    window.alert("Lyrics copied to clipboard.");
  }

  async function toggleFavorite(): Promise<void> {
    if (!songId || !song) {
      return;
    }

    if (!currentUser) {
      navigate(
        `/login?returnTo=${encodeURIComponent(buildSongPath(songId, query))}`,
      );
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

  return (
    <main className="song-page">
      <section className="song-page__grid">
        <article className="song-card">
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
            <p>{song?.Artist ? `Artist: ${song.Artist}` : "-"}</p>
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
            <div>
              <p className="section-eyebrow">Lyrics</p>
              <h2>Stay in the song.</h2>
            </div>
            <p className="muted-copy">
              Use the left and right arrow keys to navigate songs.
            </p>
          </div>

          <div className="lyrics-card__actions">
            <button className="button" type="button" onClick={copyLyrics}>
              Copy Lyrics
            </button>
            <button
              className="button button--secondary"
              disabled={isLoading || authLoading || isTogglingFavorite}
              type="button"
              onClick={toggleFavorite}
            >
              {favoriteState?.isFavorited ? "Saved" : "Save song"}
            </button>
            <div className="lyrics-card__transport">
              <button
                className="icon-button icon-button--ghost"
                type="button"
                onClick={() => navigateRelative(-1)}
              >
                ‹
              </button>
              <button
                className="icon-button icon-button--ghost"
                type="button"
                onClick={() => navigateRelative(1)}
              >
                ›
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() =>
                  setIsAutoScrollEnabled((currentValue) => !currentValue)
                }
              >
                Auto-scroll: {isAutoScrollEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="lyrics-card__body" id="lyrics-container">
            <pre className="lyrics-card__text">
              {song ? formatLyrics(song.Lyric) : "Loading lyrics..."}
            </pre>
          </div>
        </article>
      </section>
    </main>
  );
}
