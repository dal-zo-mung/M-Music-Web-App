const PLATFORMS = [
  {
    icon: "🪟",
    label: "Windows",
    note: "Windows 10 / 11",
  },
  {
    icon: "🍎",
    label: "macOS",
    note: "macOS 12+",
  },
  {
    icon: "🐧",
    label: "Linux",
    note: "Ubuntu · Debian · Arch",
  },
] as const;

export function DownloadPage(): React.JSX.Element {
  return (
    <main className="download-page">
      <div className="download-shell">
        {/* ── Hero ── */}
        <header className="download-hero">
          <div className="download-hero__badge">
            <span aria-hidden="true">🎵</span>
            <span>Desktop App</span>
          </div>
          <h1 className="download-hero__title">
            M-Music - Take Your Music Everywhere
          </h1>
          <p className="download-hero__subtitle">
            The full M-Music experience — lyrics, favourites, and AI support —
            wrapped into a native desktop app built with Electron. One
            universal build runs on every major operating system with no extra
            setup required.
          </p>
        </header>

        {/* ── Download card ── */}
        <section className="download-card" aria-labelledby="download-heading">
          <div className="download-card__glow" aria-hidden="true" />

          <div className="download-card__inner">
            <p id="download-heading" className="download-card__eyebrow">
              Cross-Platform · One Installer
            </p>
            <h2 className="download-card__title">Download M-Music</h2>
            <p className="download-card__body">
              A single installer covers Windows, macOS, and Linux. Click the
              button and run the file — the app detects your OS automatically.
            </p>

            <a
              className="download-btn"
              href="#"
              aria-label="Download M-Music desktop app"
            >
              <span className="download-btn__icon" aria-hidden="true">
                ⬇
              </span>
              <span className="download-btn__text">Download Now</span>
              <span className="download-btn__version">v1.0.0</span>
            </a>

            {/* ── Platform chips ── */}
            <div
              className="platform-row"
              role="list"
              aria-label="Supported platforms"
            >
              {PLATFORMS.map(({ icon, label, note }) => (
                <div className="platform-chip" key={label} role="listitem">
                  <span className="platform-chip__icon" aria-hidden="true">
                    {icon}
                  </span>
                  <div className="platform-chip__info">
                    <span className="platform-chip__label">{label}</span>
                    <span className="platform-chip__note">{note}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="download-card__fine">
              Free to use · No account required to install · Open settings to
              sign in and sync your favourites.
            </p>
          </div>
        </section>

        {/* ── Feature highlights ── */}
        {/* <section
          className="download-features"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="download-features__heading">
            Everything in the app
          </h2>
          <ul className="download-feature-list">
            {[
              {
                icon: "🔍",
                title: "Full Lyrics Search",
                body: "Instant search across the entire curated catalogue.",
              },
              {
                icon: "❤️",
                title: "Favourites Sync",
                body: "Save songs and access them offline or across devices.",
              },
              {
                icon: "🤖",
                title: "AI Support Chat",
                body: "Get help or discover new songs with the built-in AI assistant.",
              },
              {
                icon: "🎨",
                title: "Themes & Accents",
                body: "Dark mode, accent colours, and reading preferences all work natively.",
              },
              {
                icon: "🔒",
                title: "Secure Session",
                body: "Google OAuth and local accounts — session backed by the same server security.",
              },
            ].map(({ icon, title, body }) => (
              <li className="download-feature-item" key={title}>
                <span
                  className="download-feature-item__icon"
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <div>
                  <strong className="download-feature-item__title">
                    {title}
                  </strong>
                  <p className="download-feature-item__body">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section> */}
      </div>
    </main>
  );
}
