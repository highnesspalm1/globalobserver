import React, { forwardRef, useId } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  name?: string;
  id?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  name,
  id,
  className = '',
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const generatedId = useId();
  const switchId = id || `switch-${generatedId}`;

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}>
      <label className={styles.wrapper} htmlFor={switchId}>
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
        />
        <span className={`${styles.track} ${styles[size]}`}>
          <span className={styles.thumb}>
            <svg className={styles.checkIcon} viewBox="0 0 12 12" fill="none">
              <path
                d="M3 6L5 8L9 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        {(label || description) && (
          <div className={styles.labelGroup}>
            {label && <span className={styles.label}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </label>
    </div>
  );
});

Switch.displayName = 'Switch';

// Checkbox Component
interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  name?: string;
  id?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  name,
  id,
  className = '',
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const generatedId = useId();
  const checkboxId = id || `checkbox-${generatedId}`;

  React.useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <div className={`${styles.checkboxContainer} ${disabled ? styles.disabled : ''} ${className}`}>
      <label className={styles.checkboxWrapper} htmlFor={checkboxId}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.checkboxInput}
        />
        <span className={`${styles.checkbox} ${styles[`checkbox-${size}`]} ${checked ? styles.checkboxChecked : ''} ${indeterminate ? styles.checkboxIndeterminate : ''}`}>
          {checked && !indeterminate && (
            <svg viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {indeterminate && (
            <svg viewBox="0 0 12 12" fill="none">
              <path
                d="M3 6H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
        {(label || description) && (
          <div className={styles.labelGroup}>
            {label && <span className={styles.checkboxLabel}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </label>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
interface RadioProps {
  checked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  name?: string;
  value: string;
  id?: string;
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  name,
  value,
  id,
  className = '',
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onChange?.(value);
    }
  };

  const generatedId = useId();
  const radioId = id || `radio-${generatedId}`;

  return (
    <div className={`${styles.radioContainer} ${disabled ? styles.disabled : ''} ${className}`}>
      <label className={styles.radioWrapper} htmlFor={radioId}>
        <input
          ref={ref}
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.radioInput}
        />
        <span className={`${styles.radio} ${styles[`radio-${size}`]} ${checked ? styles.radioChecked : ''}`}>
          <span className={styles.radioDot} />
        </span>
        {(label || description) && (
          <div className={styles.labelGroup}>
            {label && <span className={styles.radioLabel}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </label>
    </div>
  );
});

Radio.displayName = 'Radio';

export default Switch;
