import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeModeContext = createContext();

const STORAGE_KEY = 'userPreferences';

const readInitialMode = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'light';
    const parsed = JSON.parse(raw);
    return parsed?.darkMode ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readInitialMode);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = { ...(parsed && typeof parsed === 'object' ? parsed : {}), darkMode: mode === 'dark' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
  }, [mode]);

  const value = useMemo(() => {
    const setDarkMode = (enabled) => setMode(enabled ? 'dark' : 'light');
    const toggleDarkMode = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    return { mode, setMode, setDarkMode, toggleDarkMode };
  }, [mode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
