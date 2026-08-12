import type { ThemeMode } from '../context/PreferencesContext';

interface MenuPanelProps {
  fontSize: number;
  isOpen: boolean;
  scrollSpeed: number;
  setFontSize: (value: number) => void;
  setScrollSpeed: (value: number) => void;
  setTheme: (value: ThemeMode) => void;
  showSongControls: boolean;
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
  theme
}: MenuPanelProps): React.JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="menu-panel" role="dialog" aria-label="Display settings">
      <div className="menu-panel__group">
        <button
          className={`theme-button ${theme === 'light' ? 'theme-button--active' : ''}`}
          type="button"
          onClick={() => setTheme('light')}
        >
          <span>Light Mode</span>
          <img alt="" src="/icons/light-mode1.png" />
        </button>
        <button
          className={`theme-button ${theme === 'dark' ? 'theme-button--active' : ''}`}
          type="button"
          onClick={() => setTheme('dark')}
        >
          <span>Dark Mode</span>
          <img alt="" src="/icons/dark-mode.png" />
        </button>
      </div>

      {showSongControls ? (
        <>
          <label className="menu-panel__slider" htmlFor="font-size-slider">
            <img alt="" src="/icons/font-size2.png" />
            <span>Lyrics Size</span>
            <input
              id="font-size-slider"
              max="40"
              min="10"
              type="range"
              value={fontSize}
              onChange={(event) => setFontSize(Number.parseInt(event.currentTarget.value, 10))}
            />
          </label>

          <label className="menu-panel__slider" htmlFor="scroll-speed-slider">
            <img alt="" src="/icons/scroll2.png" />
            <span>Scroll Speed</span>
            <input
              id="scroll-speed-slider"
              max="40"
              min="10"
              type="range"
              value={scrollSpeed}
              onChange={(event) => setScrollSpeed(Number.parseInt(event.currentTarget.value, 10))}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}
