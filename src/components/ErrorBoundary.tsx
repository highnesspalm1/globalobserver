import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0f0a',
    color: '#e8ebe3',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '24px',
    backgroundImage: `
      linear-gradient(rgba(139, 163, 111, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 163, 111, 0.02) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    background: 'linear-gradient(145deg, #1a1d16, #2a2f24)',
    border: '1px solid rgba(139, 163, 111, 0.25)',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 163, 111, 0.05)',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 32px 24px',
    textAlign: 'center' as const,
    borderBottom: '1px solid rgba(139, 163, 111, 0.15)',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.15))',
    borderRadius: '50%',
    marginBottom: '20px',
    border: '2px solid rgba(220, 38, 38, 0.3)',
  },
  icon: {
    color: '#dc2626',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#e8ebe3',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#a8b09e',
    margin: 0,
  },
  content: {
    padding: '24px 32px',
  },
  errorBox: {
    background: '#0d0f0a',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  errorMessage: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: '#dc2626',
    margin: 0,
    wordBreak: 'break-word' as const,
  },
  detailsToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(139, 163, 111, 0.1)',
    border: '1px solid rgba(139, 163, 111, 0.2)',
    borderRadius: '8px',
    color: '#a8b09e',
    fontSize: '13px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  detailsContent: {
    background: '#0d0f0a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  stackTrace: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#6b7565',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    border: 'none',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #4a5d3a, #6b7d54)',
    color: '#e8ebe3',
    border: '1px solid #8fa36f',
  },
  secondaryButton: {
    background: 'rgba(139, 163, 111, 0.15)',
    color: '#a8b09e',
    border: '1px solid rgba(139, 163, 111, 0.3)',
  },
  footer: {
    padding: '16px 32px',
    background: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(139, 163, 111, 0.2)',
    borderRadius: '6px',
    color: '#6b7565',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  reportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(139, 163, 111, 0.2)',
    borderRadius: '6px',
    color: '#6b7565',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = async () => {
    const errorText = `Error: ${this.state.error?.toString()}\n\nStack Trace:\n${this.state.errorInfo?.componentStack || 'Not available'}`;
    await navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.iconWrapper}>
                <AlertTriangle size={32} style={styles.icon} />
              </div>
              <h1 style={styles.title}>Ein Fehler ist aufgetreten</h1>
              <p style={styles.subtitle}>
                Die Anwendung konnte nicht ordnungsgemäß ausgeführt werden
              </p>
            </div>

            {/* Content */}
            <div style={styles.content}>
              {/* Error Message */}
              <div style={styles.errorBox}>
                <pre style={styles.errorMessage}>
                  {this.state.error?.message || 'Unknown error'}
                </pre>
              </div>

              {/* Details Toggle */}
              <button
                style={styles.detailsToggle}
                onClick={this.toggleDetails}
              >
                <span>Technische Details anzeigen</span>
                {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Stack Trace */}
              {this.state.showDetails && (
                <div style={styles.detailsContent}>
                  <pre style={styles.stackTrace}>
                    {this.state.error?.stack || 'Stack trace not available'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div style={styles.actions}>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={this.handleGoHome}
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
                  Startseite
                </button>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={this.handleReload}
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
                  Neu laden
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <button
                style={styles.copyButton}
                onClick={this.handleCopyError}
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
                {this.state.copied ? 'Kopiert!' : 'Fehler kopieren'}
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
                Bug melden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
