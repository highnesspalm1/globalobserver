// Language Switcher Component
import { useState, useRef, useEffect } from 'react';
import { useI18n, LANGUAGES } from '../../i18n';
import type { Language } from '../../i18n';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language)!;

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t.settings.language}
        title={t.settings.language}
      >
        <span className={styles.flag}>{currentLang.flag}</span>
        <span className={styles.code}>{currentLang.code.toUpperCase()}</span>
        <svg
          className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          className={styles.dropdown}
          role="listbox"
          aria-label={t.settings.language}
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                className={`${styles.option} ${lang.code === language ? styles.optionActive : ''}`}
                onClick={() => handleSelect(lang.code)}
                role="option"
                aria-selected={lang.code === language}
              >
                <span className={styles.flag}>{lang.flag}</span>
                <span className={styles.optionLabel}>
                  <span className={styles.nativeName}>{lang.nativeName}</span>
                  <span className={styles.englishName}>{lang.name}</span>
                </span>
                {lang.code === language && (
                  <svg
                    className={styles.check}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.5 4.5L6.5 11.5L3 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
