import { expect, test } from "bun:test";
import { readSongKey, storeSongKey } from "../client/src/lib/chordPreferences";
test("keys are per song and invalidated by a changed original key", () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
  const original = { tonic: "C", mode: "major" as const };
  storeSongKey(storage, "one", original, { ...original, tonic: "D" });
  expect(readSongKey(storage, "one", original).tonic).toBe("D");
  expect(readSongKey(storage, "two", original).tonic).toBe("C");
  expect(readSongKey(storage, "one", { ...original, tonic: "F" }).tonic).toBe("F");
  storeSongKey(storage, "one", original, original);
  expect(data.size).toBe(0);
  expect(readSongKey(null, "one", original)).toEqual(original);
});
