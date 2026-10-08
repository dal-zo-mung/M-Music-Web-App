const PLATFORMS = [
  {
    code: "WIN",
    label: "Windows",
    note: "NSIS installer",
  },
  {
    code: "MAC",
    label: "macOS",
    note: "DMG installer",
  },
  {
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
  return (
    <main className="download-page" id="main-content">
      <div className="download-shell">
        <header className="download-hero">
          <p className="download-hero__badge">
            <span aria-hidden="true" />
            M-Music Slider for desktop
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
            <span className="download-release__version">Version 1.0.0</span>
          </div>

          <div className="download-release__content">
            <p className="download-release__eyebrow">Available now</p>
            <h2 id="download-heading">Download M-Music Slider</h2>
            <p className="download-release__copy">
              Browse the cloud catalogue, download songs, design presentation
              slides, prepare setlists and control a full-screen audience
              display from one desktop workspace.
            </p>

            <a
              className="download-btn"
              href="#"
              aria-label="Download M-Music Slider desktop app, version 1.0.0"
            >
              <span className="download-btn__icon">
                <DownloadIcon />
              </span>
              <span className="download-btn__copy">
                <strong>Download M-Music Slider</strong>
                <small>Free · Version 1.0.0</small>
              </span>
            </a>

            <p className="download-release__fine-print">
              Downloaded songs, setlists and settings are
              stored locally for offline use.
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
            {PLATFORMS.map(({ code, label, note }) => (
              <div className="platform-chip" key={label} role="listitem">
                <span className="platform-chip__code" aria-hidden="true">
                  {code}
                </span>
                <span className="platform-chip__info">
                  <strong>{label}</strong>
                  <small>{note}</small>
                </span>
                <span className="platform-chip__status">Supported</span>
              </div>
            ))}
          </div>
        </section>

        <section className="download-purpose" aria-labelledby="purpose-heading">
          <div className="download-section-heading">
            <p>Why M-Music Slider</p>
            <h2 id="purpose-heading">Built for Live Lyrics Presentation</h2>
          </div>

          <div className="download-purpose__cards">
            <article className="download-purpose__card download-purpose__card--primary">
              <span className="download-purpose__label">Its purpose</span>
              <h3>Prepare once. Present clearly.</h3>
              <p>
                M-Music Slider turns song lyrics into audience-ready slides. It
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
