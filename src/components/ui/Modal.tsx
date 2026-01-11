import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { useI18n } from '../../i18n';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = '',
}) => {
  const { t } = useI18n();
  
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        className={`${styles.modal} ${styles[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && (
              <div className={styles.headerContent}>
                <h2 id="modal-title" className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
            )}
            {showCloseButton && (
              <IconButton
                aria-label={t.ui.modal.close}
                icon={<X size={18} />}
                onClick={onClose}
                size="sm"
              />
            )}
          </div>
        )}
        
        <div className={styles.content}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
}) => {
  const { t } = useI18n();
  const confirmText = confirmLabel || t.app.confirm;
  const cancelText = cancelLabel || t.app.cancel;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className={styles.confirmActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${styles[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t.app.loading : confirmText}
          </button>
        </div>
      }
    >
      <p className={styles.confirmMessage}>{message}</p>
    </Modal>
  );
};
