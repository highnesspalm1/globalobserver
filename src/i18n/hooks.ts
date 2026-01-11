// i18n Hooks for Global Observer
import { useContext } from 'react';
import { I18nContext } from './context';
import type { I18nContextType } from './context';

// Hook to use i18n
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

// Hook for just translations (lighter)
export function useTranslation() {
  const { t, translate } = useI18n();
  return { t, translate };
}
