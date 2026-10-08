import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import type { SongBrowseResponse } from "@shared/types";
import { fetchJson } from "./api";
import {
  buildBrowseUrl,
  buildLibraryPath,
  buildLibrarySongPath,
  readLibraryState,
} from "./library";

export function useSongNavigation(songId: string) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    location.state &&
    typeof location.state === "object" &&
    "returnTo" in location.state &&
    location.state.returnTo === "/profile"
      ? "/profile"
      : undefined;
  const state = readLibraryState(params);
  const { data, error, mutate } = useSWR<SongBrowseResponse>(
    songId ? buildBrowseUrl(state, songId) : null,
    fetchJson,
  );
  const [pending, setPending] = useState(false);
  const [navigationError, setNavigationError] = useState("");
  const activeSong = useRef(songId);
  const inFlight = useRef(false);
  const songs = data?.songs ?? [];
  const currentIndex = songs.findIndex((song) => song._id === songId);
  const context = { ...state, page: data?.pagination.page ?? state.page };

  useEffect(() => {
    activeSong.current = songId;
    setNavigationError("");
  }, [songId]);
  useEffect(
    () => () => {
      activeSong.current = "";
    },
    [],
  );

  const navigateRelative = useCallback(
    async (offset: -1 | 1): Promise<void> => {
      if (
        !data ||
        currentIndex < 0 ||
        inFlight.current ||
        data.counts.found < 2
      )
        return;
      inFlight.current = true;
      setPending(true);
      setNavigationError("");
      try {
        let page = data.pagination.page;
        let nextSong = songs[currentIndex + offset];
        if (!nextSong) {
          page =
            ((page - 1 + offset + data.pagination.totalPages) %
              data.pagination.totalPages) +
            1;
          const next = await fetchJson<SongBrowseResponse>(
            buildBrowseUrl({ ...state, page }),
          );
          page = next.pagination.page;
          nextSong =
            offset === 1 ? next.songs[0] : next.songs[next.songs.length - 1];
        }
        if (activeSong.current !== songId) return;
        if (nextSong)
          navigate(buildLibrarySongPath(nextSong._id, { ...state, page }), {
            state: returnTo ? { returnTo } : null,
          });
        else
          setNavigationError(
            "The song list changed. Return to the library to refresh it.",
          );
      } catch {
        if (activeSong.current === songId)
          setNavigationError("Couldn’t open the next song. Please try again.");
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [
      data,
      currentIndex,
      songs,
      state.q,
      state.language,
      state.category,
      state.page,
      navigate,
      returnTo,
      songId,
    ],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.isComposing
      )
        return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input, textarea, select, button, a, [contenteditable], [role='menu']",
        )
      )
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        void navigateRelative(event.key === "ArrowLeft" ? -1 : 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigateRelative]);

  return {
    backPath: returnTo ?? buildLibraryPath(context),
    songPath: buildLibrarySongPath(songId, context),
    canNavigate: Boolean(
      data && data.counts.found > 1 && currentIndex >= 0 && !pending && !error,
    ),
    navigateRelative,
    navigationError:
      navigationError || (error ? "Couldn’t load song navigation." : ""),
    retryNavigation: () => {
      setNavigationError("");
      void mutate();
    },
  };
}
