// i18n Constants for Global Observer
import type { Language } from './types';

// Language metadata
export const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

// Storage key
export const LANGUAGE_STORAGE_KEY = 'globalobserver-language';
