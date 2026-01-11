// i18n Context and Provider for Global Observer
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Language, TranslationKeys } from './types';
import { de } from './de';
import { en } from './en';
import { tr } from './tr';
import { LANGUAGE_STORAGE_KEY } from './constants';
import { I18nContext } from './context';

// All translations
const translations: Record<Language, TranslationKeys> = { de, en, tr };

// Detect browser language
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  if (browserLang === 'de' || browserLang === 'en' || browserLang === 'tr') {
    return browserLang as Language;
  }
  // Default to German
  return 'de';
}

// Get saved language or detect
function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'de' || saved === 'en' || saved === 'tr')) {
      return saved as Language;
    }
  } catch {
    // localStorage not available
  }
  return detectBrowserLanguage();
}

// Provider component
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Set language and persist
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
    // Update document language
    document.documentElement.lang = lang;
  }, []);

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Current translations
  const t = useMemo(() => translations[language], [language]);

  // Helper for nested key access with interpolation
  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = t;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Interpolate params
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => 
        String(params[paramKey] ?? `{${paramKey}}`)
      );
    }
    
    return value;
  }, [t]);

  // Format relative time
  const formatRelativeTime = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return t.time.now;
    if (diffMins < 60) return t.time.minutesAgo.replace('{n}', String(diffMins));
    if (diffHours < 24) return t.time.hoursAgo.replace('{n}', String(diffHours));
    if (diffDays < 7) return t.time.daysAgo.replace('{n}', String(diffDays));
    if (diffWeeks < 4) return t.time.weeksAgo.replace('{n}', String(diffWeeks));
    return t.time.monthsAgo.replace('{n}', String(diffMonths));
  }, [t]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    translate,
    formatRelativeTime,
  }), [language, setLanguage, t, translate, formatRelativeTime]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}
