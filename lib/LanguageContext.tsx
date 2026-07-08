'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Language, translations, TranslationKey } from './i18n';

export const LANGUAGE_STORAGE_KEY = 'hackathon-language';

function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('en')) return 'en';
  return 'en';
}

function documentLangFor(language: Language): string {
  switch (language) {
    case 'de':
      return 'de';
    case 'es':
      return 'es';
    case 'en':
      return 'en';
    default: {
      const _exhaustive: never = language;
      return _exhaustive;
    }
  }
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: TranslationKey, key: string) => string;
  tArray: (section: TranslationKey, key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (raw === 'en' || raw === 'de' || raw === 'es') {
        setLanguageState(raw);
        return;
      }
      // Legacy keys from older builds → default to English
      if (raw === 'ru' || raw === 'uz') {
        setLanguageState('en');
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
        return;
      }
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, detected);
    } catch {
      setLanguageState(detectBrowserLanguage());
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = documentLangFor(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const t = (section: TranslationKey, key: string): string => {
    const sectionData = translations[section] as Record<
      string,
      | { en: string; de: string; es: string }
      | { en: string[]; de: string[]; es: string[] }
    >;
    const item = sectionData[key];

    if (!item) return key;

    if (Array.isArray((item as { en: string[]; de: string[]; es: string[] }).en)) {
      return (item as { en: string[]; de: string[]; es: string[] })[language].join(', ');
    }

    return (item as { en: string; de: string; es: string })[language];
  };

  const tArray = (section: TranslationKey, key: string): string[] => {
    const sectionData = translations[section] as Record<string, unknown>;
    const item = sectionData[key] as { en: string[]; de: string[]; es: string[] } | undefined;

    if (!item) return [];

    return item[language] || [];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
