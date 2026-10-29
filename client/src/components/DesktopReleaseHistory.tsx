import useSWR from "swr";
import type { DesktopReleaseHistoryResponse } from "@shared/types";
import { fetchJson } from "../lib/api";

const PLATFORM_LABELS = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
  all: "All platforms",
} as const;

const releaseDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Rangoon",
});

export function DesktopReleaseHistory(): React.JSX.Element {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<DesktopReleaseHistoryResponse>("/api/desktop/releases", fetchJson);
  const releases = data?.releases ?? [];

  return (
    <section
      className="download-history"
      aria-labelledby="release-history-heading"
    >
      <header className="download-history__heading">
        <h2 id="release-history-heading">Released data</h2>
        <p>Desktop versions, release dates and what changed.</p>
      </header>

      {isLoading && <p role="status">Loading release history...</p>}
      {error && (
        <div className="download-history__message" role="status">
          <p>Unable to load release history. Please try again.</p>
          <button
            className="download-release__retry"
            type="button"
            disabled={isValidating}
            onClick={() => void mutate()}
          >
            {isValidating ? "Checking..." : "Try again"}
          </button>
        </div>
      )}
      {!isLoading && !error && releases.length === 0 && (
        <p role="status">No desktop releases have been published yet.</p>
      )}

      {releases.length > 0 && (
        <ol className="download-history__list">
          {releases.map((release) => {
            const date = new Date(release.released_at || release.created_at);
            const hasDate = !Number.isNaN(date.getTime());

            return (
              <li key={release.id}>
                <article className="download-history__entry">
                  <div className="download-history__entry-heading">
                    <h3>Version {release.version}</h3>
                    <span className="download-history__platform">
                      {PLATFORM_LABELS[release.platform]}
                    </span>
                    {release.is_active && (
                      <span className="download-history__current">
                        Current release
                      </span>
                    )}
                  </div>
                  <p className="download-history__date">
                    {hasDate ? (
                      <>
                        {release.released_at ? "Released on " : "Recorded on "}
                        <time dateTime={date.toISOString()}>
                          {releaseDateFormatter.format(date)}
                        </time>
                      </>
                    ) : (
                      "Release date unavailable"
                    )}
                  </p>
                  {release.release_notes?.trim() && (
                    <p className="download-history__notes">
                      {release.release_notes}
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
