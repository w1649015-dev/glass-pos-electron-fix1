import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

type Translations = Record<string, string>;

interface I18nContextType {
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Cache translations to avoid re-fetching on re-renders
const loadedTranslations: { en?: Translations, ar?: Translations } = {};

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language } = useSettings();
  const [translations, setTranslations] = useState<{ en: Translations, ar: Translations }>({ 
      en: loadedTranslations.en || {}, 
      ar: loadedTranslations.ar || {} 
  });
  const [loading, setLoading] = useState(!loadedTranslations.en);

  useEffect(() => {
    // Only fetch if translations are not already cached
    if (!loadedTranslations.en) {
      setLoading(true);
      Promise.all([
        fetch('./translations/en.json').then(res => res.json()),
        fetch('./translations/ar.json').then(res => res.json())
      ]).then(([en, ar]) => {
        loadedTranslations.en = en;
        loadedTranslations.ar = ar;
        setTranslations({ en, ar });
      }).catch(error => {
        console.error("Failed to load translation files", error);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, []);

  const t = useCallback((key: string): string => {
    const langFile = translations[language] as Translations | undefined;
    return langFile?.[key] || key;
  }, [language, translations]);

  if (loading) {
    // Prevents rendering the app with missing translations on first load
    return null; 
  }

  return (
    <I18nContext.Provider value={{ t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
