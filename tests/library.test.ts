import { describe, expect, test } from "bun:test";
import {
  buildBrowseUrl,
  buildLibraryPath,
  buildLibrarySongPath,
  readLibraryState,
} from "../client/src/lib/library";

describe("library links", () => {
  test("old category links become separate language and category filters", () => {
    expect(
      readLibraryState(
        new URLSearchParams("category=myanmar-worship&q=grace&page=2"),
      ),
    ).toEqual({ q: "grace", category: "worship", language: "my", page: 2 });
    expect(
      readLibraryState(new URLSearchParams("category=english-hymns")),
    ).toEqual({ q: "", category: "hymns", language: "en", page: 1 });
  });
  test("an explicit language overrides the legacy language", () => {
    expect(
      readLibraryState(
        new URLSearchParams("category=myanmar-worship&language=en"),
      ).language,
    ).toBe("en");
  });
  test("all filters are omitted and invalid page values recover", () => {
    for (const page of [
      "-1",
      "0",
      "NaN",
      "1.2",
      "Infinity",
      "9007199254740992",
    ]) {
      const state = readLibraryState(
        new URLSearchParams(`category=all&language=all&page=${page}`),
      );
      expect(buildLibraryPath(state)).toBe("/");
    }
  });
  test("Unicode search, custom categories and page survive detail/back links", () => {
    const state = {
      q: "ကျေးဇူး & grace?",
      language: "my" as const,
      category: "worship",
      page: 3,
    };
    const songUrl = new URL(
      buildLibrarySongPath("song-id", state),
      "https://music.test",
    );
    const backUrl = new URL(
      buildLibraryPath(readLibraryState(songUrl.searchParams)),
      "https://music.test",
    );
    expect(readLibraryState(backUrl.searchParams)).toEqual(state);
    const browse = new URL(
      buildBrowseUrl(state, "song-id"),
      "https://music.test",
    );
    expect(browse.pathname).toBe("/api/songs/browse");
    expect(browse.searchParams.get("q")).toBe(state.q);
    expect(browse.searchParams.get("songId")).toBe("song-id");
    expect(browse.searchParams.get("limit")).toBe("20");
  });
});
