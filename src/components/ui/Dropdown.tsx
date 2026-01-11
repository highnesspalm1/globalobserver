import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'tactical';
  maxHeight?: number;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Auswählen...',
  label,
  error,
  disabled = false,
  searchable = false,
  clearable = false,
  multiple = false,
  size = 'md',
  variant = 'default',
  maxHeight = 280,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Group options
  const groupedOptions = options.reduce((acc, opt) => {
    const group = opt.group || '__default__';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, DropdownOption[]>);

  // Filter options
  const filteredGroups = Object.entries(groupedOptions).reduce((acc, [group, opts]) => {
    const filtered = opts.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) acc[group] = filtered;
    return acc;
  }, {} as Record<string, DropdownOption[]>);

  // Get selected options
  const selectedValues = useMemo(() => 
    Array.isArray(value) ? value : value ? [value] : [],
    [value]
  );
  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  // Display value
  const displayValue = selectedOptions.length > 0
    ? multiple
      ? `${selectedOptions.length} ausgewählt`
      : selectedOptions[0].label
    : placeholder;

  // Handle select
  const handleSelect = useCallback((optValue: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(optValue)
        ? selectedValues.filter(v => v !== optValue)
        : [...selectedValues, optValue];
      onChange(newValue);
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
    setSearchQuery('');
  }, [multiple, selectedValues, onChange]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  }, [multiple, onChange]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles[size]} ${styles[variant]} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && <label className={styles.label}>{label}</label>}

      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={`${styles.value} ${selectedOptions.length === 0 ? styles.placeholder : ''}`}>
          {selectedOptions.length === 1 && selectedOptions[0].icon && (
            <span className={styles.selectedIcon}>{selectedOptions[0].icon}</span>
          )}
          {displayValue}
        </span>

        <div className={styles.actions}>
          {clearable && selectedValues.length > 0 && (
            <span className={styles.clearButton} onClick={handleClear}>
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown} style={{ maxHeight }}>
          {searchable && (
            <div className={styles.searchContainer}>
              <Search size={14} className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                className={styles.searchInput}
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className={styles.optionsList}>
            {Object.entries(filteredGroups).map(([group, opts]) => (
              <div key={group} className={styles.optionGroup}>
                {group !== '__default__' && (
                  <div className={styles.groupLabel}>{group}</div>
                )}
                {opts.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.option} ${selectedValues.includes(opt.value) ? styles.optionSelected : ''} ${opt.disabled ? styles.optionDisabled : ''}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    disabled={opt.disabled}
                  >
                    {opt.icon && <span className={styles.optionIcon}>{opt.icon}</span>}
                    <div className={styles.optionContent}>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      {opt.description && (
                        <span className={styles.optionDescription}>{opt.description}</span>
                      )}
                    </div>
                    {selectedValues.includes(opt.value) && (
                      <Check size={16} className={styles.checkIcon} />
                    )}
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(filteredGroups).length === 0 && (
              <div className={styles.emptyState}>Keine Ergebnisse gefunden</div>
            )}
          </div>
        </div>
      )}

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Dropdown;
