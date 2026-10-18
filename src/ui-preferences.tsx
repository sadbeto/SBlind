import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { translate, type Language } from './i18n';

type Theme = 'light' | 'dark';
type Preferences = { language: Language; theme: Theme | null };
const STORAGE_KEY = 'sblind.ui.v1';
const Context = createContext<{
  language: Language; dark: boolean; t: (text: string) => string;
  setLanguage: (language: Language) => void; setTheme: (theme: Theme) => void;
} | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [preferences, setPreferences] = useState<Preferences>({ language: 'es', theme: null });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        setPreferences({
          language: saved?.language === 'en' ? 'en' : 'es',
          theme: saved?.theme === 'dark' || saved?.theme === 'light' ? saved.theme : null,
        });
      } catch { /* Storage unavailable or invalid: safe defaults, form still works. */ }
    }
    setLoaded(true);
  }, []);
  const dark = (preferences.theme ?? systemTheme) === 'dark';
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.lang = preferences.language;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.title = preferences.language === 'es' ? 'SBlind | Tu proyecto' : 'SBlind | Your project';
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
    catch { /* Preferences are optional; never block intake when storage is disabled. */ }
  }, [preferences, dark, loaded]);
  return <Context.Provider value={{
    language: preferences.language, dark,
    t: text => translate(text, preferences.language),
    setLanguage: language => setPreferences(prev => ({ ...prev, language })),
    setTheme: theme => setPreferences(prev => ({ ...prev, theme })),
  }}>{children}</Context.Provider>;
}

export function useUi() {
  const value = useContext(Context);
  if (!value) throw new Error('useUi requires UiProvider');
  return value;
}
