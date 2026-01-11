import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import styles from './Alert.module.css';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'tactical';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const DEFAULT_ICONS: Record<AlertVariant, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <AlertCircle size={18} />,
  tactical: <AlertTriangle size={18} />,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}) => {
  const { t } = useI18n();
  
  return (
    <div className={`${styles.alert} ${styles[variant]} ${className}`} role="alert">
      {showIcon && (
        <span className={styles.icon}>{icon || DEFAULT_ICONS[variant]}</span>
      )}

      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <p className={styles.message}>{children}</p>
      </div>

      {action && (
        <button className={styles.action} onClick={action.onClick}>
          {action.label}
          <ChevronRight size={14} />
        </button>
      )}

      {dismissible && (
        <button className={styles.dismiss} onClick={onDismiss} aria-label={t.app.close}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Banner Component - Full width notification
interface BannerProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  children,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  action,
  className = '',
}) => {
  const { t } = useI18n();
  
  return (
    <div className={`${styles.banner} ${styles[variant]} ${className}`} role="alert">
      <div className={styles.bannerContent}>
        {showIcon && (
          <span className={styles.bannerIcon}>{icon || DEFAULT_ICONS[variant]}</span>
        )}
        <span className={styles.bannerMessage}>{children}</span>
        {action && (
          <button className={styles.bannerAction} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button className={styles.bannerDismiss} onClick={onDismiss} aria-label={t.app.close}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Callout Component - Highlighted information box
interface CalloutProps {
  variant?: 'info' | 'warning' | 'tip' | 'important';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const CALLOUT_ICONS: Record<string, React.ReactNode> = {
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  tip: <CheckCircle size={18} />,
  important: <AlertCircle size={18} />,
};

export const Callout: React.FC<CalloutProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className = '',
}) => {
  return (
    <div className={`${styles.callout} ${styles[`callout-${variant}`]} ${className}`}>
      <div className={styles.calloutHeader}>
        <span className={styles.calloutIcon}>{icon || CALLOUT_ICONS[variant]}</span>
        {title && <span className={styles.calloutTitle}>{title}</span>}
      </div>
      <div className={styles.calloutContent}>{children}</div>
    </div>
  );
};

export default Alert;
