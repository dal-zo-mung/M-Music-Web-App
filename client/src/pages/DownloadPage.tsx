import { useState } from "react";
import useSWR from "swr";
import type { DesktopLatestReleaseResponse, Release } from "@shared/types";
import { fetchJson } from "../lib/api";

const RELEASE_ENDPOINT = "/api/desktop/releases/latest";
const RELEASES_CACHE_KEY = `${RELEASE_ENDPOINT}?platform=desktop`;
type DesktopPlatform = "win" | "mac" | "linux";
type PlatformReleases = Record<DesktopPlatform, Release | null>;

const PLATFORM_LABELS = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
  all: "All platforms",
} as const;

const PLATFORMS = [
  {
    platform: "win",
    code: "WIN",
    label: "Windows",
  },
  {
    platform: "mac",
    code: "MAC",
    label: "macOS",
  },
  {
    platform: "linux",
    code: "LNX",
    label: "Linux",
  },
] as const;

type NavigatorWithClientHints = Navigator & {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
  };
};

export function detectDesktopPlatform(): DesktopPlatform | null {
  if (typeof navigator === "undefined") return null;

  const browser = navigator as NavigatorWithClientHints;
  const userAgent = browser.userAgent;

  if (
    browser.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod|CrOS/i.test(userAgent) ||
    (browser.platform === "MacIntel" && browser.maxTouchPoints > 1)
  ) {
    return null;
  }

  const platform =
    browser.userAgentData?.platform || browser.platform || userAgent;

  if (/Windows|Win32|Win64/i.test(platform)) return "win";
  if (/macOS|MacIntel|Macintosh/i.test(platform)) return "mac";
  if (/Linux|X11/i.test(platform)) return "linux";
  return null;
}

async function fetchLatestRelease(
  platform: DesktopPlatform,
): Promise<DesktopLatestReleaseResponse> {
  const response = await fetchJson<DesktopLatestReleaseResponse>(
    `${RELEASE_ENDPOINT}?platform=${platform}`,
  );
  if (response.release) {
    const url = new URL(response.release.download_url);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Invalid installer URL.");
    }
  }
  return response;
}

async function fetchPlatformReleases(): Promise<PlatformReleases> {
  const entries = await Promise.all(
    PLATFORMS.map(async ({ platform }) => {
      const response = await fetchLatestRelease(platform);
      return [platform, response.release] as const;
    }),
  );

  return Object.fromEntries(entries) as PlatformReleases;
}

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
    useSWR<PlatformReleases>(RELEASES_CACHE_KEY, fetchPlatformReleases, {
      refreshInterval: 60_000,
    });
  const [detectedPlatform] = useState<DesktopPlatform | null>(() =>
    detectDesktopPlatform(),
  );
  const [selectedPlatform, setSelectedPlatform] = useState<DesktopPlatform>(
    () => detectDesktopPlatform() ?? "win",
  );
  const [downloadingPlatform, setDownloadingPlatform] =
    useState<DesktopPlatform | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const selectedPlatformInfo = PLATFORMS.find(
    ({ platform }) => platform === selectedPlatform,
  )!;
  const release = data?.[selectedPlatform] ?? null;
  const releaseStatus = isLoading
    ? "Checking latest release…"
    : error
      ? "Release details unavailable"
      : release
        ? `Version ${release.version}`
        : `Not released for ${selectedPlatformInfo.label} yet`;
  const statusMessage =
    downloadError ||
    (error ? "Unable to load the latest release. Please try again." : "");

  async function downloadLatest(platform: DesktopPlatform): Promise<void> {
    setSelectedPlatform(platform);
    setDownloadingPlatform(platform);
    setDownloadError("");
    try {
      const latest = await fetchLatestRelease(platform);
      await mutate(
        (current) => ({
          win: current?.win ?? null,
          mac: current?.mac ?? null,
          linux: current?.linux ?? null,
          [platform]: latest.release,
        }),
        { revalidate: false },
      );
      if (!latest.release) {
        setDownloadError(
          `No ${PLATFORM_LABELS[platform]} release is available yet. Please check back soon.`,
        );
        return;
      }
      window.location.assign(latest.release.download_url);
    } catch {
      setDownloadError("Unable to start the download. Please try again.");
    } finally {
      setDownloadingPlatform(null);
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
            <span className="download-release__version">
              Windows · macOS · Linux
            </span>
          </div>

          <div className="download-release__content">
            <p className="download-release__eyebrow">Desktop releases</p>
            <h2 id="download-heading">Download M Slide Show</h2>
            <br></br>
            <fieldset className="download-platform-picker">
              <legend>Choose your platform</legend>
              <div className="download-platform-picker__options">
                {PLATFORMS.map(({ platform, code, label }) => {
                  const platformRelease = data?.[platform] ?? null;
                  const isSelected = selectedPlatform === platform;
                  const isRecommended = detectedPlatform === platform;

                  return (
                    <button
                      type="button"
                      key={platform}
                      className={`download-platform-option${isSelected ? " download-platform-option--selected" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setDownloadError("");
                      }}
                    >
                      <span className="download-platform-option__topline">
                        <span className="download-platform-option__code">
                          {code}
                        </span>
                        {isRecommended && (
                          <span className="download-platform-option__recommended">
                            Recommended
                          </span>
                        )}
                      </span>
                      <strong>{label}</strong>
                      <small
                        className={
                          !isLoading && !error && !platformRelease
                            ? "download-platform-option__status--coming-soon"
                            : undefined
                        }
                      >
                        {isLoading
                          ? "Checking…"
                          : error
                            ? "Unavailable"
                            : platformRelease
                              ? `Version ${platformRelease.version}`
                              : "Coming soon"}
                      </small>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              className="download-btn"
              onClick={() => void downloadLatest(selectedPlatform)}
              disabled={isLoading || downloadingPlatform !== null || !release}
              aria-busy={downloadingPlatform === selectedPlatform}
              aria-describedby={statusMessage ? "download-status" : undefined}
            >
              <span className="download-btn__icon">
                <DownloadIcon />
              </span>
              <span className="download-btn__copy">
                <strong>
                  {downloadingPlatform === selectedPlatform
                    ? "Preparing download…"
                    : `Download for ${selectedPlatformInfo.label}`}
                </strong>
                <small>
                  {release
                    ? `Free · Version ${release.version}${release.platform === "all" ? " · Universal link" : ""}`
                    : releaseStatus}
                </small>
              </span>
            </button>

            {statusMessage && (
              <p
                id="download-status"
                className="download-release__fine-print"
                role="status"
              >
                {statusMessage}
              </p>
            )}
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
            <br></br>

            <p className="download-release__fine-print">
              Downloaded songs, setlists and settings are stored locally for
              offline use.
            </p>
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
