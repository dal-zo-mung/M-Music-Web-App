import { describe, expect, test } from "bun:test";
import {
  DARK_SONG_DETAIL_COLORS,
  LIGHT_SONG_DETAIL_COLORS,
  getRandomSongDetailColorIndex,
  getSongDetailCardColor,
} from "../client/src/lib/songDetailCard";

describe("song detail card colors", () => {
  test("provides ten unique colors for each theme", () => {
    expect(LIGHT_SONG_DETAIL_COLORS).toHaveLength(10);
    expect(DARK_SONG_DETAIL_COLORS).toHaveLength(10);
    expect(new Set(LIGHT_SONG_DETAIL_COLORS).size).toBe(10);
    expect(new Set(DARK_SONG_DETAIL_COLORS).size).toBe(10);
  });

  test("keeps the chosen color index paired across themes", () => {
    for (let index = 0; index < 10; index += 1) {
      expect(getSongDetailCardColor(index, false)).toBe(
        LIGHT_SONG_DETAIL_COLORS[index],
      );
      expect(getSongDetailCardColor(index, true)).toBe(
        DARK_SONG_DETAIL_COLORS[index],
      );
      expect(getSongDetailCardColor(index, false)).toBe(
        LIGHT_SONG_DETAIL_COLORS[index],
      );
    }
  });

  test("a first draw can reach all ten colors within the palette bounds", () => {
    const reached = Array.from({ length: 10 }, (_, index) =>
      getRandomSongDetailColorIndex(-1, () => (index + 0.5) / 10),
    );
    expect(reached).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(getRandomSongDetailColorIndex(-1, () => 0)).toBe(0);
    expect(getRandomSongDetailColorIndex(-1, () => 1)).toBe(9);
  });

  test("each previous color leaves exactly the other nine available", () => {
    for (let previous = 0; previous < 10; previous += 1) {
      const reached = Array.from({ length: 9 }, (_, index) =>
        getRandomSongDetailColorIndex(previous, () => (index + 0.5) / 9),
      );
      expect(reached).toEqual(
        Array.from({ length: 10 }, (_, index) => index).filter(
          (index) => index !== previous,
        ),
      );
    }
  });

  test("remembers the last opening without repeating its color", () => {
    let previous = getRandomSongDetailColorIndex(-1, () => 0);
    for (let opening = 0; opening < 30; opening += 1) {
      const index = getRandomSongDetailColorIndex(undefined, () => 0);
      expect(index).not.toBe(previous);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(10);
      previous = index;
    }
  });
});
