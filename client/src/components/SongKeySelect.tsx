import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { KEY_TONICS, type SongKey } from "@m-music/chord-core";

export function SongKeySelect({
  value,
  originalTonic,
  onChange,
}: {
  value: SongKey;
  originalTonic: string;
  onChange: (key: SongKey) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const tonics = [...new Set([...KEY_TONICS, originalTonic])];
  const [active, setActive] = useState(tonics.indexOf(value.tonic));
  const typed = useRef({ text: "", time: 0 });

  function show() {
    typed.current = { text: "", time: 0 };
    setActive(tonics.indexOf(value.tonic));
    setOpen(true);
  }

  function choose(index: number) {
    onChange({ ...value, tonic: tonics[index] });
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !list.current) return;
    const option = list.current.children[active] as HTMLElement | undefined;
    if (!option) return;
    const scroller = list.current;
    if (option.offsetTop < scroller.scrollTop)
      scroller.scrollTop = option.offsetTop;
    else if (
      option.offsetTop + option.offsetHeight >
      scroller.scrollTop + scroller.clientHeight
    )
      scroller.scrollTop =
        option.offsetTop + option.offsetHeight - scroller.clientHeight;
  }, [open, active]);

  return (
    <div
      className="song-key-select"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className="button button--secondary song-key-select__trigger"
        type="button"
        role="combobox"
        aria-label={`Song key: ${value.tonic} ${value.mode}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            if (open) {
              event.preventDefault();
              event.stopPropagation();
            }
            setOpen(false);
          } else if (event.key === "Tab") {
            setOpen(false);
          } else if (
            ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
          ) {
            event.preventDefault();
            if (!open) {
              show();
              if (event.key === "Home") setActive(0);
              if (event.key === "End") setActive(tonics.length - 1);
            } else
              setActive((index) =>
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tonics.length - 1
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        tonics.length) %
                      tonics.length,
              );
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else show();
          } else if (
            /^[a-g#b]$/i.test(event.key) &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            const now = Date.now();
            typed.current = {
              text:
                (now - typed.current.time < 700 ? typed.current.text : "") +
                event.key.toLowerCase(),
              time: now,
            };
            const index = tonics.findIndex((tonic) =>
              tonic.toLowerCase().startsWith(typed.current.text),
            );
            setOpen(true);
            if (index >= 0) setActive(index);
          }
        }}
      >
        <span className="song-key-select__label">Key</span>
        <span>
          {value.tonic} {value.mode}
        </span>
        <svg
          className="song-key-select__chevron"
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      <div
        className="song-key-select__menu"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          id={`${id}-list`}
          role="listbox"
          aria-label="Song key"
          className="song-key-select__list"
          ref={list}
        >
          {tonics.map((tonic, index) => (
            <div
              id={`${id}-option-${index}`}
              key={tonic}
              role="option"
              aria-selected={tonic === value.tonic}
              data-active={active === index}
              className="song-key-select__option"
              onPointerDown={(event) => event.preventDefault()}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse") setActive(index);
              }}
              onClick={() => choose(index)}
            >
              <span className="song-key-select__option-label">
                <span>
                  {tonic} {value.mode}
                </span>
                {tonic === originalTonic && (
                  <span className="song-key-select__original">Original</span>
                )}
              </span>
              {tonic === value.tonic && (
                <svg
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="m4 10 4 4 8-8" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
