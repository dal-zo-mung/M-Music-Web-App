import { useState } from "react";
import useSWR from "swr";
import type { DesktopLatestReleaseResponse } from "@shared/types";
import { fetchJson } from "../lib/api";

const RELEASE_ENDPOINT = "/api/desktop/releases/latest";
const PLATFORM_LABELS = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
  all: "All platforms",
} as const;

async function fetchLatestRelease(): Promise<DesktopLatestReleaseResponse> {
  const response =
    await fetchJson<DesktopLatestReleaseResponse>(RELEASE_ENDPOINT);
  if (response.release) {
    const url = new URL(response.release.download_url);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Invalid installer URL.");
    }
  }
  return response;
}

const PLATFORMS = [
  {
    platform: "win",
    code: "WIN",
    label: "Windows",
    note: "NSIS installer",
  },
  {
    platform: "mac",
    code: "MAC",
    label: "macOS",
    note: "DMG installer",
  },
  {
    platform: "linux",
    code: "LNX",
    label: "Linux",
    note: "AppImage package",
  },
] as const;

const FEATURES = [
  {
    number: "01",
    title: "Cloud-to-offline library",
    body: "Browse the public song catalogue, filter by language or category, and download songs for offline use.",
  },
  {
    number: "02",
    title: "Flexible slide editor",
    body: "Build lyric slides, position text boxes, and customise fonts, colours, backgrounds, transitions and slide size.",
  },
  {
    number: "03",
    title: "Service-ready setlists",
    body: "Group songs for a service or event, reorder them by drag and drop, and save each setlist locally.",
  },
  {
    number: "04",
    title: "Live presenter controls",
    body: "Run a dedicated audience window, preview nearby slides, navigate by keyboard, blank the screen and toggle fullscreen.",
  },
] as const;

function DownloadIcon(): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

function AppMark(): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96">
      <path
        className="download-app-mark__disc"
        d="M48 18a30 30 0 1 0 0 60 30 30 0 0 0 0-60Z"
      />
      <path
        className="download-app-mark__ring"
        d="M48 30a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z"
      />
      <path
        className="download-app-mark__note"
        d="M56 35v22.5a7.5 7.5 0 1 1-4-6.65V39l14-3v16.5a7.5 7.5 0 1 1-4-6.65V33.5L56 35Z"
      />
    </svg>
  );
}

export function DownloadPage(): React.JSX.Element {
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<DesktopLatestReleaseResponse>(RELEASE_ENDPOINT, fetchLatestRelease, {
      refreshInterval: 60_000,
    });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const release = data?.release;
  const releaseStatus = isLoading
    ? "Checking latest release…"
    : error
      ? "Release details unavailable"
      : release
        ? `Version ${release.version}`
        : "No release available yet";

  async function downloadLatest(): Promise<void> {
    setDownloading(true);
    setDownloadError("");
    try {
      // Always resolve the active installer again at click time.
      const latest = await fetchLatestRelease();
      await mutate(latest, { revalidate: false });
      if (!latest.release) {
        setDownloadError(
          "No desktop release is available yet. Please check back soon.",
        );
        return;
      }
      window.location.assign(latest.release.download_url);
    } catch {
      setDownloadError("Unable to start the download. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="download-page" id="main-content">
      <div className="download-shell">
        <header className="download-hero">
          <p className="download-hero__badge">
            <span aria-hidden="true" />M Slide Show for desktop
          </p>
          <h1 className="download-hero__title">
            Ready to present all worship, hymn, Christmas, and gospel songs.
          </h1>
        </header>

        <section
          className="download-release"
          aria-labelledby="download-heading"
        >
          <div className="download-release__visual" aria-hidden="true">
            <span className="download-release__label">LYRICS PRESENTER</span>
            <div className="download-app-mark">
              <AppMark />
            </div>
            <span className="download-release__version">{releaseStatus}</span>
          </div>

          <div className="download-release__content">
            <p className="download-release__eyebrow">
              {release
                ? `Available for ${PLATFORM_LABELS[release.platform]}`
                : "Desktop releases"}
            </p>
            <h2 id="download-heading">Download M Slide Show</h2>
            <p className="download-release__copy">
              Browse the cloud catalogue, download songs, design presentation
              slides, prepare setlists and control a full-screen audience
              display from one desktop workspace.
            </p>

            <button
              type="button"
              className="download-btn"
              onClick={() => void downloadLatest()}
              disabled={isLoading || downloading || !release}
              aria-busy={downloading}
              aria-describedby="download-status"
            >
              <span className="download-btn__icon">
                <DownloadIcon />
              </span>
              <span className="download-btn__copy">
                <strong>
                  {downloading
                    ? "Preparing download…"
                    : "Download M Slide Show"}
                </strong>
                <small>
                  {release
                    ? `Free · Version ${release.version} · ${PLATFORM_LABELS[release.platform]}`
                    : releaseStatus}
                </small>
              </span>
            </button>

            <p
              id="download-status"
              className="download-release__fine-print"
              role="status"
            >
              {downloadError ||
                (error
                  ? "Unable to load the latest release. Please try again."
                  : releaseStatus)}
            </p>
            {!isLoading && (error || !release) && (
              <button
                type="button"
                className="download-release__retry"
                disabled={isValidating}
                onClick={() => {
                  setDownloadError("");
                  void mutate();
                }}
              >
                {isValidating ? "Checking…" : "Check again"}
              </button>
            )}

            <p className="download-release__fine-print">
              Downloaded songs, setlists and settings are stored locally for
              offline use.
            </p>
          </div>
        </section>

        <section
          className="download-platforms"
          aria-labelledby="platform-heading"
        >
          <div className="download-section-heading">
            <p>Cross-platform</p>
            <h2 id="platform-heading">Windows, macOS and Linux</h2>
          </div>

          <div className="platform-row" role="list">
            {PLATFORMS.map(({ platform, code, label, note }) => (
              <div className="platform-chip" key={label} role="listitem">
                <span className="platform-chip__code" aria-hidden="true">
                  {code}
                </span>
                <span className="platform-chip__info">
                  <strong>{label}</strong>
                  <small>{note}</small>
                </span>
                <span className="platform-chip__status">
                  {isLoading
                    ? "Checking…"
                    : error
                      ? "Unavailable"
                      : release &&
                          (release.platform === platform ||
                            release.platform === "all")
                        ? "Available"
                        : "Not released"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="download-purpose" aria-labelledby="purpose-heading">
          <div className="download-section-heading">
            <p>Why M Slide Show</p>
            <h2 id="purpose-heading">Built for Live Lyrics Presentation</h2>
          </div>

          <div className="download-purpose__cards">
            <article className="download-purpose__card download-purpose__card--primary">
              <span className="download-purpose__label">Its purpose</span>
              <h3>Prepare once. Present clearly.</h3>
              <p>
                M Slide Show turns song lyrics into audience-ready slides. It
                brings song preparation, slide design, service planning and live
                presentation control into one offline-first workspace.
              </p>
            </article>

            <article className="download-purpose__card">
              <span className="download-purpose__label">Who it is for</span>
              <h3>Teams responsible for the screen</h3>
              <p>
                Designed for people who prepare and operate projected lyrics
                during worship services and lyric-led events.
              </p>
              <ul className="download-purpose__audience">
                <li>Churches</li>
                <li>Worship teams</li>
                <li>Media operators</li>
                <li>Event presenters</li>
              </ul>
            </article>
          </div>
        </section>

        <section
          className="download-features"
          aria-labelledby="features-heading"
        >
          <div className="download-section-heading">
            <p>Built for worship teams</p>
            <h2 id="features-heading">
              Everything You Need for Live Lyrics Presentation
            </h2>
          </div>

          <ol className="download-feature-list">
            {FEATURES.map(({ number, title, body }) => (
              <li className="download-feature-item" key={number}>
                <span
                  className="download-feature-item__number"
                  aria-hidden="true"
                >
                  {number}
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
