import { useEffect, useRef, useState } from "react";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_LANGUAGES,
  type LibraryState,
} from "../lib/library";

interface Props {
  state: LibraryState;
  onChange: (changes: Partial<LibraryState>) => void;
}

export function LibraryFilters({ state, onChange }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const language = LIBRARY_LANGUAGES.find(
    (item) => item.value === state.language,
  )!;
  const categories = LIBRARY_CATEGORIES.some(
    (item) => item.value === state.category,
  )
    ? LIBRARY_CATEGORIES
    : [...LIBRARY_CATEGORIES, { value: state.category, label: state.category }];

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent): void {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function focusOption(index: number): void {
    const options = root.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitemradio"]',
    );
    if (options?.length)
      options[(index + options.length) % options.length].focus();
  }

  return (
    <section className="library-filters" aria-label="Song filters">
      <div
        className="library-language"
        ref={root}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            trigger.current?.focus();
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <button
          id="language-filter"
          ref={trigger}
          className="library-language__trigger"
          type="button"
          aria-label={`Song language: ${language.label}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="language-options"
          onClick={() => setOpen(!open)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              requestAnimationFrame(() =>
                focusOption(event.key === "ArrowDown" ? 0 : 2),
              );
            }
          }}
        >
          {language.label}
          <span aria-hidden="true" className={open ? "is-open" : ""}>
            ⌄
          </span>
        </button>
        {open && (
          <div
            id="language-options"
            className="library-language__menu"
            role="menu"
            aria-label="Song language"
          >
            {LIBRARY_LANGUAGES.map((item, index) => (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={item.value === state.language}
                onKeyDown={(event) => {
                  if (
                    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
                  ) {
                    event.preventDefault();
                    focusOption(
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : index + (event.key === "ArrowDown" ? 1 : -1),
                    );
                  }
                }}
                onClick={() => {
                  onChange({ language: item.value });
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                {item.label}
                <span aria-hidden="true">
                  {item.value === state.language ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        className="library-categories"
        role="group"
        aria-label="Song categories"
      >
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            className="library-category"
            aria-pressed={state.category === item.value}
            onClick={(event) => {
              onChange({ category: item.value });
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
