import {
  chordName,
  lyricUnits,
  visibleLines,
  type ChordChart,
} from "@m-music/chord-core";
import "../styles/chord-lyrics.css";

export function ChordLyrics({
  chart,
  showChords,
}: {
  chart: ChordChart;
  showChords: boolean;
}) {
  return (
    <div className="m-chords">
      {visibleLines(chart, showChords).map((line) => {
        if (line.kind === "blank")
          return (
            <div
              key={line.id}
              data-chord-row={line.id}
              className="m-chords__blank"
              aria-hidden="true"
            >
              &nbsp;
            </div>
          );
        if (line.kind === "section")
          return (
            <div
              key={line.id}
              data-chord-row={line.id}
              className="m-chords__section"
            >
              {line.text}
            </div>
          );
        if (line.kind === "instrumental")
          return (
            <div
              key={line.id}
              data-chord-row={line.id}
              className="m-chords__instrumental"
            >
              {line.label && <span>{line.label}: </span>}
              {line.chords.map((c, i) => (
                <span key={i}>{chordName(c)}</span>
              ))}
            </div>
          );
        if (!showChords)
          return (
            <div
              key={line.id}
              data-chord-row={line.id}
              className="m-chords__plain"
            >
              {line.segments.map((s) => s.text).join("") || "\u00a0"}
            </div>
          );
        const withChords = line.segments.some((s) => s.chord);
        return (
          <div
            key={line.id}
            data-chord-row={line.id}
            className="m-chords__line"
          >
            {lyricUnits(line.segments).map((unit, i) => (
              <span className="m-chords__unit" key={i}>
                {withChords && (
                  <span
                    className="m-chords__chord"
                    aria-label={
                      unit.chord ? `Chord ${chordName(unit.chord)}` : undefined
                    }
                    aria-hidden={!unit.chord}
                  >
                    {unit.chord ? chordName(unit.chord) : "\u00a0"}
                  </span>
                )}
                <span className="m-chords__word">{unit.text || "\u200b"}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
