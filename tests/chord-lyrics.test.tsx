import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { parseChartText, transposeChart } from "@m-music/chord-core";
import { ChordLyrics } from "../client/src/components/ChordLyrics";
import { ChordControlsAndLyrics } from "../client/src/components/ChordReader";
import { PreferencesProvider } from "../client/src/context/PreferencesContext";

const original = parseChartText(
  "{section: Intro}\n[C] [G7]\n\n{section: Verse}\n[C/E]First phrase [G7]ending\n[C]ကျေးဇူးတော်",
  { tonic: "C", mode: "major" },
);

test("renders transposed chords with lyric anchors and escapes lyric markup", () => {
  const markup = renderToStaticMarkup(
    <ChordLyrics
      chart={transposeChart(original, { tonic: "D", mode: "major" })}
      showChords
    />,
  );
  expect(markup).toContain('aria-label="Chord D/F#"');
  expect(markup).toContain('aria-label="Chord A7"');
  expect(markup).toContain('data-chord-row="line-5"');
  expect(markup).not.toContain('aria-label="Chord C/E"');
  const literal = parseChartText("[C]<script>alert(1)</script>", {
    tonic: "C",
    mode: "major",
  });
  expect(
    renderToStaticMarkup(<ChordLyrics chart={literal} showChords />),
  ).toContain("&lt;script&gt;");
});

test("hiding chords retains lyrics, verse headings and blank rows but removes instrumentals", () => {
  const markup = renderToStaticMarkup(
    <ChordLyrics chart={original} showChords={false} />,
  );
  expect(markup).toContain("First phrase ending");
  expect(markup).toContain("ကျေးဇူးတော်");
  expect(markup).toContain("Verse");
  expect(markup).toContain('data-chord-row="line-3"');
  expect(markup).not.toContain("Intro");
  expect(markup).not.toContain("Chord C/E");
});

test("reader renders with safe defaults when browser storage is unavailable", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() {
        throw new Error("Blocked");
      },
    },
  });
  try {
    const markup = renderToStaticMarkup(
      <PreferencesProvider>
        <ChordControlsAndLyrics
          songId="example"
          value={original}
          lyrics={[]}
          container={{ current: null }}
          onInteract={() => {}}
        />
      </PreferencesProvider>,
    );
    expect(markup).toContain("Show chords");
    expect(markup).not.toContain("Original key");
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain("First phrase ending");
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
