// ThemeProvider — applies Light / Dark / System themes to the entire app.
//
//   - mode: 'light' | 'dark' | 'system' (user's preference; persisted to localStorage)
//   - resolved: 'light' | 'dark' (the mode actually applied after resolving System)
//   - palette: paletteFor(resolved) — flat color lookup for inline-style consumers
//
// On mount: reads localStorage, applies the right class to <html>.
// While mode === 'system': listens to prefers-color-scheme and re-applies live.

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { paletteFor } from '../design/colors';

const STORAGE_KEY = 'theme';
const VALID_MODES = new Set(['light', 'dark', 'system']);

const ThemeContext = createContext(null);

function readStoredMode() {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.has(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveMode(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemPrefersDark() ? 'dark' : 'light';
}

function applyThemeClass(resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);
  const [resolved, setResolved] = useState(() => resolveMode(readStoredMode()));

  const setMode = useCallback((next) => {
    if (!VALID_MODES.has(next)) return;
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  // Apply resolved theme to <html> and persist.
  useEffect(() => {
    const next = resolveMode(mode);
    setResolved(next);
    applyThemeClass(next);
  }, [mode]);

  // Live OS preference changes — only meaningful while mode === 'system'.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = resolveMode('system');
      setResolved(next);
      applyThemeClass(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const palette = useMemo(() => paletteFor(resolved), [resolved]);

  const value = useMemo(
    () => ({ mode, setMode, resolved, palette }),
    [mode, setMode, resolved, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Allow direct hook import from this file if a peer prefers one entry point.
export { ThemeContext };
export default ThemeProvider;
