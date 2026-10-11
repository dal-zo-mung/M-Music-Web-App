import { useEffect, useRef, useState } from "react";
import { getRouteErrorContent } from "../lib/route-error";

interface ErrorScreenProps {
  error: unknown;
  standalone?: boolean;
}

export function ErrorScreen({
  error,
  standalone = false,
}: ErrorScreenProps): React.JSX.Element {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine !== false,
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const content = getRouteErrorContent(error, online);

  useEffect(() => {
    function updateConnection() {
      setOnline(navigator.onLine !== false);
    }
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    headingRef.current?.focus();
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  return (
    <main
      className={`error-screen ${standalone ? "error-screen--standalone library-app" : ""}`}
      id="main-content"
      aria-labelledby="error-title"
    >
      {standalone && (
        <a
          className="error-screen__brand"
          href="/"
          aria-label="M-Music song library"
        >
          M-Music
        </a>
      )}
      <section className="error-card" data-kind={content.kind}>
        <div className="error-art" aria-hidden="true">
          <div className="error-art__orbit" />
          <div className="error-art__record">
            <span className="error-art__label">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13M9 8l12-2" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </span>
          </div>
          <span className="error-art__pause">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </span>
          <span className="error-art__spark error-art__spark--one">+</span>
          <span className="error-art__spark error-art__spark--two">+</span>
        </div>
        <p className="error-card__status">
          <span />
          {content.label}
        </p>
        <h1 id="error-title" ref={headingRef} tabIndex={-1}>
          {content.title}
        </h1>
        <p className="error-card__description">{content.description}</p>
        <div className="error-card__actions">
          {content.kind === "access" ? (
            <a className="error-action error-action--primary" href="/login">
              Sign in
            </a>
          ) : (
            content.kind !== "not-found" && (
              <button
                className="error-action error-action--primary"
                type="button"
                onClick={() => window.location.reload()}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 7v5h-5M4 17v-5h5" />
                  <path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
                </svg>
                Reload page
              </button>
            )
          )}
          <a
            className={`error-action ${content.kind === "not-found" ? "error-action--primary" : "error-action--secondary"}`}
            href="/"
          >
            Go to library
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </a>
        </div>
        <p className="error-card__hint">{content.hint}</p>
      </section>
      {standalone && (
        <p className="error-screen__footer">
          M-Music · Find your next favorite.
        </p>
      )}
    </main>
  );
}
