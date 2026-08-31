import { useState, useEffect, useCallback } from 'react';
import { ViewTheme, VIEW_THEMES } from '../renderer/types';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'openx_studio_theme_preference';

export const THEME_PREFERENCES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export function getSystemTheme(): ViewTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return VIEW_THEMES.LIGHT;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? VIEW_THEMES.DARK
    : VIEW_THEMES.LIGHT;
}

export function applyThemeToDocument(theme: ViewTheme): void {
  const isDark = theme === VIEW_THEMES.DARK;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function resolveActiveTheme(pref: ThemePreference, systemTheme: ViewTheme): ViewTheme {
  if (pref === THEME_PREFERENCES.DARK) return VIEW_THEMES.DARK;
  if (pref === THEME_PREFERENCES.LIGHT) return VIEW_THEMES.LIGHT;
  return systemTheme;
}

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEME_PREFERENCES.LIGHT || stored === THEME_PREFERENCES.DARK) {
      return stored;
    }
  } catch {
    // Ignore localStorage access errors (e.g. security sandbox)
  }
  return THEME_PREFERENCES.SYSTEM;
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ViewTheme>(getSystemTheme);

  // Listen to OS / Browser system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? VIEW_THEMES.DARK : VIEW_THEMES.LIGHT);
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const activeTheme = resolveActiveTheme(preference, systemTheme);

  // Sync DOM with active theme
  useEffect(() => {
    applyThemeToDocument(activeTheme);
  }, [activeTheme]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setPreference(pref);
    try {
      if (pref === THEME_PREFERENCES.SYSTEM) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, pref);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = activeTheme === VIEW_THEMES.LIGHT ? THEME_PREFERENCES.DARK : THEME_PREFERENCES.LIGHT;
    setThemePreference(nextTheme);
  }, [activeTheme, setThemePreference]);

  return {
    theme: activeTheme,
    themePreference: preference,
    isSystem: preference === THEME_PREFERENCES.SYSTEM,
    setThemePreference,
    toggleTheme,
  };
}
