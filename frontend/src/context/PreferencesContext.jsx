import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { i18n } from '../lib/i18n.js';

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('reducedMotion') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
    localStorage.setItem('theme', theme);
    localStorage.setItem('reducedMotion', reducedMotion ? '1' : '0');
  }, [theme, reducedMotion]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = useMemo(() => i18n[lang] || i18n.ru, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      theme,
      setTheme,
      reducedMotion,
      setReducedMotion,
      t
    }),
    [lang, theme, reducedMotion, t]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
