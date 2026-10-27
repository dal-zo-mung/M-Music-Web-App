import { useId } from "react";
import type { ThemeMode } from "../context/PreferencesContext";
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
          <ReadingSlider
            id={controlId + "-font"}
            label="Text size"
            value={fontSize}
            min={10}
            max={40}
            unit="px"
            valueText={fontSize + " pixels"}
            onChange={setFontSize}
          />
          <ReadingSlider
            id={controlId + "-speed"}
            label="Scroll speed"
            value={scrollSpeed}
            min={1}
            max={40}
            unit="px/s"
            valueText={scrollSpeed + " pixels per second"}
            onChange={setScrollSpeed}
          />
        </>
      ) : null}
    </div>
  );
}

function ReadingSlider({
  id,
  label,
  value,
  min,
  max,
  unit,
  valueText,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  valueText: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="reader-setting">
      <label htmlFor={id}>{label}</label>
      <span className="reader-setting__track">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-valuetext={valueText}
          onChange={(event) =>
            onChange(Number.parseInt(event.currentTarget.value, 10))
          }
        />
        <span className="reader-setting__ticks" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </span>
      </span>
      <output htmlFor={id} aria-hidden="true">
        {value}
        {unit}
      </output>
    </div>
  );
}
