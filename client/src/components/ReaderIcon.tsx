type ReaderIconName =
  | "text"
  | "speed"
  | "minus"
  | "plus"
  | "play"
  | "pause"
  | "previous"
  | "next"
  | "bookmark";

export function ReaderIcon({
  name,
}: {
  name: ReaderIconName;
}): React.JSX.Element {
  return (
    <svg
      className="reader-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "text" && (
        <>
          <path d="M4 19 10 5l6 14M6 14h8M17 9h5M19.5 9v10" />
        </>
      )}
      {name === "speed" && (
        <>
          <path d="M4 19a9 9 0 1 1 16 0M12 12l5-5M5 13h1M18 13h1M12 4v2" />
          <circle cx="12" cy="13" r="1.5" />
        </>
      )}
      {name === "minus" && <path d="M5 12h14" />}
      {name === "plus" && <path d="M5 12h14M12 5v14" />}
      {name === "play" && <path d="m8 5 11 7-11 7Z" />}
      {name === "pause" && <path d="M8 5v14M16 5v14" />}
      {name === "previous" && <path d="m15 5-7 7 7 7" />}
      {name === "next" && <path d="m9 5 7 7-7 7" />}
      {name === "bookmark" && <path d="M6 4h12v17l-6-4-6 4Z" />}
    </svg>
  );
}
