// Error Fallback Component - Separate file for Fast Refresh compatibility
import type { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Bug } from 'lucide-react';
import { useI18n } from '../i18n';
import { errorFallbackStyles } from './errorFallbackStyles';

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
  onToggleDetails: () => void;
  onCopyError: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

// Functional component for error display that can use hooks
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  showDetails,
  copied,
  onToggleDetails,
  onCopyError,
  onReload,
  onGoHome,
}) => {
  const { t } = useI18n();
  const styles = errorFallbackStyles;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <AlertTriangle size={32} style={styles.icon} />
          </div>
          <h1 style={styles.title}>{t.errors.errorOccurred}</h1>
          <p style={styles.subtitle}>
            {t.errors.applicationError}
          </p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Error Message */}
          <div style={styles.errorBox}>
            <pre style={styles.errorMessage}>
              {error?.message || t.errors.unknownError}
            </pre>
          </div>

          {/* Details Toggle */}
          <button
            style={styles.detailsToggle}
            onClick={onToggleDetails}
          >
            <span>{t.errors.showTechnicalDetails}</span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Stack Trace */}
          {showDetails && (
            <div style={styles.detailsContent}>
              <pre style={styles.stackTrace}>
                {error?.stack || t.errors.stackTraceNotAvailable}
                {errorInfo?.componentStack}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={onGoHome}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 163, 111, 0.25)';
                e.currentTarget.style.color = '#e8ebe3';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(139, 163, 111, 0.15)';
                e.currentTarget.style.color = '#a8b09e';
              }}
            >
              <Home size={18} />
              {t.errors.goHome}
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={onReload}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #6b7d54, #8fa36f)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 163, 111, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #4a5d3a, #6b7d54)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <RefreshCw size={18} />
              {t.errors.reload}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            style={styles.copyButton}
            onClick={onCopyError}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 163, 111, 0.4)';
              e.currentTarget.style.color = '#a8b09e';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 163, 111, 0.2)';
              e.currentTarget.style.color = '#6b7565';
            }}
          >
            <Copy size={14} />
            {copied ? t.success.copied : t.errors.copyError}
          </button>
          <button
            style={styles.reportButton}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 163, 111, 0.4)';
              e.currentTarget.style.color = '#a8b09e';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 163, 111, 0.2)';
              e.currentTarget.style.color = '#6b7565';
            }}
          >
            <Bug size={14} />
            {t.errors.reportBug}
          </button>
        </div>
      </div>
    </div>
  );
};
