import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  hasChords,
  keyFingerprint,
  safeChart,
  transposeChart,
  type SongKey,
} from "@m-music/chord-core";
import { usePreferences } from "../context/PreferencesContext";
import { readSongKey, storeSongKey } from "../lib/chordPreferences";
import { ChordLyrics } from "./ChordLyrics";
import { SongKeySelect } from "./SongKeySelect";

function localStore() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
export function ChordControlsAndLyrics({
  songId,
  value,
  lyrics,
  container,
  onInteract,
  children,
}: {
  songId: string;
  value: unknown;
  lyrics: string[];
  container: RefObject<HTMLDivElement | null>;
  onInteract: () => void;
  children?: (controls: ReactNode, lyrics: ReactNode) => ReactNode;
}) {
  const chart = useMemo(() => safeChart(value), [value]);
  const { showChords, setShowChords, fontSize } = usePreferences();
  const [selected, setSelected] = useState<{
    songId: string;
    fingerprint: string;
    key: SongKey;
  } | null>(null);
  const fingerprint = chart ? keyFingerprint(chart.originalKey) : "";
  const target = useMemo(
    () =>
      chart
        ? selected?.songId === songId && selected.fingerprint === keyFingerprint(chart.originalKey)
          ? selected.key
          : readSongKey(localStore(), songId, chart.originalKey)
        : null,
    [chart, selected, songId],
  );
  const displayed = useMemo(
    () => (chart && target ? transposeChart(chart, target) : null),
    [chart, target],
  );
  const content = useRef<HTMLDivElement>(null);
  const pause = useRef(onInteract);
  pause.current = onInteract;
  const anchor = useRef<{ ids: string[]; offset: number } | null>(null);
  const capture = () => {
    const scroller = container.current;
    if (!scroller || !scroller.scrollTop) {
      anchor.current = null;
      return;
    }
    const top = scroller.getBoundingClientRect().top;
    const rows = [...scroller.querySelectorAll<HTMLElement>("[data-chord-row]")];
    const index = rows.findIndex((el) => el.getBoundingClientRect().bottom > top);
    // If an instrumental disappears, prefer the next lyric, then the preceding row.
    anchor.current =
      index < 0
        ? null
        : {
            ids: [...rows.slice(index), ...rows.slice(0, index).reverse()].map(
              (row) => row.dataset.chordRow!,
            ),
            offset: rows[index].getBoundingClientRect().top - top,
          };
  };
  const restore = () => {
    const scroller = container.current;
    if (!scroller || !anchor.current) return;
    const rows = [...scroller.querySelectorAll<HTMLElement>("[data-chord-row]")];
    const id = anchor.current.ids.find((candidate) =>
      rows.some((row) => row.dataset.chordRow === candidate),
    );
    const row = rows.find((candidate) => candidate.dataset.chordRow === id);
    if (row)
      scroller.scrollTop +=
        row.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        anchor.current.offset;
  };
  const previous = useRef({ songId, displayed, showChords, fontSize });
  useLayoutEffect(() => {
    const before = previous.current;
    if (before.songId !== songId) anchor.current = null;
    else if (
      before.displayed !== displayed ||
      before.showChords !== showChords ||
      before.fontSize !== fontSize
    ) {
      pause.current();
      restore();
    }
    capture();
    previous.current = { songId, displayed, showChords, fontSize };
  }, [songId, displayed, showChords, fontSize]);
  useLayoutEffect(() => {
    const scroller = container.current;
    const body = content.current;
    if (!scroller || !body) return;
    scroller.addEventListener("scroll", capture, { passive: true });
    let size = `${body.offsetWidth}:${body.offsetHeight}:${scroller.clientHeight}`;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            const next = `${body.offsetWidth}:${body.offsetHeight}:${scroller.clientHeight}`;
            if (size === next) return;
            size = next;
            pause.current();
            restore();
            capture();
          });
    observer?.observe(body);
    observer?.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", capture);
      observer?.disconnect();
    };
  }, [container, songId, lyrics]);
  const change = (next: SongKey) => {
    if (!chart) return;
    onInteract();
    capture();
    setSelected({ songId, fingerprint, key: next });
    storeSongKey(localStore(), songId, chart.originalKey, next);
  };
  const controls =
    chart && hasChords(chart) && target ? (
      <div className="chord-controls">
        <SongKeySelect value={target} originalTonic={chart.originalKey.tonic} onChange={change} />
        <button
          className="button button--secondary"
          type="button"
          aria-pressed={showChords}
          onClick={() => {
            onInteract();
            capture();
            setShowChords(!showChords);
          }}
        >
          {showChords ? "Hide chords" : "Show chords"}
        </button>
      </div>
    ) : null;
  const body = (
    <div ref={content}>
      {!controls && <p className="chord-unavailable">Chords not available</p>}
      {displayed ? (
        <ChordLyrics chart={displayed} showChords={showChords} />
      ) : (
        <div style={{ whiteSpace: "pre-wrap" }}>{lyrics.join("\n")}</div>
      )}
    </div>
  );
  return children ? (
    children(controls, body)
  ) : (
    <>
      {controls}
      {body}
    </>
  );
}
