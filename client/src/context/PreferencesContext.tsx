import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface PreferencesContextValue {
  fontSize: number;
  scrollSpeed: number;
  setFontSize: (value: number) => void;
  setScrollSpeed: (value: number) => void;
  setTheme: (value: ThemeMode) => void;
  theme: ThemeMode;
}

const FONT_SIZE_STORAGE_KEY = 'mMusic.fontSize';
const SCROLL_SPEED_STORAGE_KEY = 'mMusic.scrollSpeed';
const THEME_STORAGE_KEY = 'mMusic.theme';

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredNumber(key: string, fallback: number): number {
  const rawValue = window.localStorage.getItem(key);
  const parsedValue = Number.parseInt(rawValue ?? '', 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function readStoredTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
}

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps): React.JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());
  const [fontSize, setFontSize] = useState<number>(() => readStoredNumber(FONT_SIZE_STORAGE_KEY, 18));
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => readStoredNumber(SCROLL_SPEED_STORAGE_KEY, 18));

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--lyrics-font-size', `${fontSize}px`);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    window.localStorage.setItem(SCROLL_SPEED_STORAGE_KEY, String(scrollSpeed));
  }, [scrollSpeed]);

  return (
    <PreferencesContext.Provider
      value={{
        fontSize,
        scrollSpeed,
        setFontSize,
        setScrollSpeed,
        setTheme,
        theme
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider.');
  }

  return context;
}
