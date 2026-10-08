import { useId } from "react";
import type { ThemeMode } from "../context/PreferencesContext";
import { ReaderIcon } from "./ReaderIcon";
import { ThemeIcon } from "./ThemeIcon";

interface MenuPanelProps {
  fontSize: number;
  isOpen: boolean;
  scrollSpeed: number;
  setFontSize: (value: number) => void;
  setScrollSpeed: (value: number) => void;
  setTheme: (value: ThemeMode) => void;
  showSongControls: boolean;
  showThemeControls?: boolean;
  theme: ThemeMode;
}

export function MenuPanel({
  fontSize,
  isOpen,
  scrollSpeed,
  setFontSize,
  setScrollSpeed,
  setTheme,
  showSongControls,
  showThemeControls = true,
  theme,
}: MenuPanelProps): React.JSX.Element | null {
  const controlId = useId();
  if (!isOpen) {
    return null;
  }

  return (
    <div className="menu-panel" role="dialog" aria-label="Display settings">
      {showThemeControls && (
        <div className="menu-panel__group">
          <button
            className={`theme-button ${theme === "light" ? "theme-button--active" : ""}`}
            type="button"
            onClick={() => setTheme("light")}
          >
            <span>Light Mode</span>
            <ThemeIcon mode="light" />
          </button>
          <button
            className={`theme-button ${theme === "dark" ? "theme-button--active" : ""}`}
            type="button"
            onClick={() => setTheme("dark")}
          >
            <span>Dark Mode</span>
            <ThemeIcon mode="dark" />
          </button>
        </div>
      )}

      {showSongControls ? (
        <>
          <div className="reader-setting">
            <div className="reader-setting__heading">
              <label htmlFor={`${controlId}-font`}>
                <ReaderIcon name="text" /> Lyrics size
              </label>
              <output htmlFor={`${controlId}-font`}>{fontSize} px</output>
            </div>
            <div className="reader-setting__adjust">
              <button
                type="button"
                aria-label="Decrease lyrics size"
                disabled={fontSize <= 10}
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              >
                <ReaderIcon name="minus" />
              </button>
              <input
                id={`${controlId}-font`}
                aria-valuetext={`${fontSize} pixels`}
                max="40"
                min="10"
                type="range"
                value={fontSize}
                onChange={(event) =>
                  setFontSize(Number.parseInt(event.currentTarget.value, 10))
                }
              />
              <button
                type="button"
                aria-label="Increase lyrics size"
                disabled={fontSize >= 40}
                onClick={() => setFontSize(Math.min(40, fontSize + 2))}
              >
                <ReaderIcon name="plus" />
              </button>
            </div>
            <div className="reader-setting__scale">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <div className="reader-setting">
            <div className="reader-setting__heading">
              <label htmlFor={`${controlId}-speed`}>
                <ReaderIcon name="speed" /> Scroll speed
              </label>
              <output htmlFor={`${controlId}-speed`}>{scrollSpeed} px/s</output>
            </div>
            <div className="reader-setting__adjust">
              <button
                type="button"
                aria-label="Decrease scroll speed"
                disabled={scrollSpeed <= 1}
                onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))}
              >
                <ReaderIcon name="minus" />
              </button>
              <input
                id={`${controlId}-speed`}
                aria-valuetext={`${scrollSpeed} pixels per second`}
                max="40"
                min="1"
                type="range"
                value={scrollSpeed}
                onChange={(event) =>
                  setScrollSpeed(Number.parseInt(event.currentTarget.value, 10))
                }
              />
              <button
                type="button"
                aria-label="Increase scroll speed"
                disabled={scrollSpeed >= 40}
                onClick={() => setScrollSpeed(Math.min(40, scrollSpeed + 1))}
              >
                <ReaderIcon name="plus" />
              </button>
            </div>
            <div className="reader-setting__scale">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
