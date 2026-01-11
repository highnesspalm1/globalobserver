// i18n Context for Global Observer
import { createContext } from 'react';
import type { Language, TranslationKeys } from './types';

// Context type
export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  // Helper function for interpolation
  translate: (key: string, params?: Record<string, string | number>) => string;
  // Format relative time
  formatRelativeTime: (date: Date) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);
