import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import styles from './Input.module.css';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'tactical';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  success,
  leftIcon,
  rightIcon,
  clearable,
  onClear,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  type = 'text',
  className = '',
  value,
  onChange,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const hasValue = value !== undefined && value !== '';

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`
          ${styles.inputWrapper}
          ${styles[size]}
          ${styles[variant]}
          ${error ? styles.hasError : ''}
          ${success ? styles.hasSuccess : ''}
          ${disabled ? styles.disabled : ''}
          ${leftIcon ? styles.hasLeftIcon : ''}
          ${rightIcon || isPassword || clearable ? styles.hasRightIcon : ''}
        `}
      >
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={styles.input}
          {...props}
        />

        <div className={styles.rightIcons}>
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClear}
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}

          {isPassword && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {rightIcon && !isPassword && <span className={styles.rightIcon}>{rightIcon}</span>}

          {error && <AlertCircle size={16} className={styles.statusIcon} />}
          {success && !error && <CheckCircle size={16} className={styles.statusIconSuccess} />}
        </div>
      </div>

      {(error || hint) && (
        <span className={`${styles.message} ${error ? styles.errorMessage : ''}`}>
          {error ? <AlertCircle size={12} /> : hint && <Info size={12} />}
          {error || hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'tactical';
  fullWidth?: boolean;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  autoResize = false,
  className = '',
  disabled,
  onChange,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  };

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {props.required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`
          ${styles.textareaWrapper}
          ${styles[size]}
          ${styles[variant]}
          ${error ? styles.hasError : ''}
          ${disabled ? styles.disabled : ''}
        `}
      >
        <textarea
          ref={ref}
          onChange={handleChange}
          disabled={disabled}
          className={styles.textarea}
          {...props}
        />
      </div>

      {(error || hint) && (
        <span className={`${styles.message} ${error ? styles.errorMessage : ''}`}>
          {error ? <AlertCircle size={12} /> : hint && <Info size={12} />}
          {error || hint}
        </span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;
