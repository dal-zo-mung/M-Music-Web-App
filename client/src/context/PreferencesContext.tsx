import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

interface PreferencesContextValue {
  showChords: boolean;
  setShowChords: (value: boolean) => void;
  fontSize: number;
  scrollSpeed: number;
  setFontSize: (value: number) => void;
  setScrollSpeed: (value: number) => void;
  setTheme: (value: ThemeMode) => void;
  theme: ThemeMode;
}

const FONT_SIZE_STORAGE_KEY = "mMusic.fontSize";
const SCROLL_SPEED_STORAGE_KEY = "mMusic.scrollSpeed";
const THEME_STORAGE_KEY = "mMusic.theme";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStoredValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Preferences remain usable for this session when storage is blocked. */
  }
}

function readStoredNumber(key: string, fallback: number, min: number, max: number): number {
  const rawValue = readStoredValue(key);
  const parsedValue = Number.parseInt(rawValue ?? "", 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsedValue));
}

function readStoredTheme(): ThemeMode {
  const storedTheme = readStoredValue(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps): React.JSX.Element {
  const [showChords, setShowChordsState] = useState(() => {
    try {
      return window.localStorage.getItem("mMusic.showChords") === "true";
    } catch {
      return false;
    }
  });
  const setShowChords = (value: boolean) => {
    setShowChordsState(value);
    try {
      window.localStorage.setItem("mMusic.showChords", String(value));
    } catch {
      /* memory fallback */
    }
  };
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());
  const [fontSize, setFontSizeState] = useState<number>(() =>
    readStoredNumber(FONT_SIZE_STORAGE_KEY, 18, 10, 40),
  );
  const [scrollSpeed, setScrollSpeedState] = useState<number>(() =>
    readStoredNumber(SCROLL_SPEED_STORAGE_KEY, 18, 1, 40),
  );
  const setFontSize = useCallback((value: number) => {
    if (Number.isFinite(value)) setFontSizeState(Math.max(10, Math.min(40, Math.round(value))));
  }, []);
  const setScrollSpeed = useCallback((value: number) => {
    if (Number.isFinite(value)) setScrollSpeedState(Math.max(1, Math.min(40, Math.round(value))));
  }, []);

  const setTheme = useCallback(
    (value: ThemeMode): void => {
      if (value === theme) return;

      const updateTheme = (): void => {
        document.body.classList.toggle("dark-mode", value === "dark");
        setThemeState(value);
      };
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (typeof document.startViewTransition !== "function" || reduceMotion) {
        updateTheme();
        return;
      }

      document.startViewTransition(updateTheme);
    },
    [theme],
  );

  useEffect(() => {
    document.body.classList.toggle("dark-mode", theme === "dark");
    writeStoredValue(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--lyrics-font-size", `${fontSize}px`);
    writeStoredValue(FONT_SIZE_STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    writeStoredValue(SCROLL_SPEED_STORAGE_KEY, String(scrollSpeed));
  }, [scrollSpeed]);

  return (
    <PreferencesContext.Provider
      value={{
        showChords,
        setShowChords,
        fontSize,
        scrollSpeed,
        setFontSize,
        setScrollSpeed,
        setTheme,
        theme,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider.");
  }

  return context;
}
