import type { ThemeMode } from "../context/PreferencesContext";

export function ThemeIcon({ mode }: { mode: ThemeMode }): React.JSX.Element {
  return (
    <svg
      className={`theme-icon theme-icon--${mode}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {mode === "light" ? (
        <>
          <circle className="theme-icon__halo" cx="14" cy="14" r="7.25" />
          <circle className="theme-icon__sun" cx="14" cy="14" r="3.75" />
          <path
            className="theme-icon__rays"
            d="M14 2.75v2.1m0 18.3v2.1M2.75 14h2.1m18.3 0h2.1M6.05 6.05l1.5 1.5m12.9 12.9 1.5 1.5M6.05 21.95l1.5-1.5m12.9-12.9 1.5-1.5"
          />
        </>
      ) : (
        <>
          <path
            className="theme-icon__moon"
            d="M21.9 17.35A9.4 9.4 0 0 1 10.65 4.1a9.75 9.75 0 1 0 11.25 13.25Z"
          />
          <path
            className="theme-icon__sparkle"
            d="M20.5 4.25v3.5m-1.75-1.75h3.5"
          />
          <circle className="theme-icon__star" cx="23" cy="11" r="1" />
        </>
      )}
    </svg>
  );
}
