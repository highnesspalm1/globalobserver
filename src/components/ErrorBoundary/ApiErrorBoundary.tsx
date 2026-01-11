// API Error Boundary - Handles errors in data-fetching components
import { Component, type ReactNode } from 'react';
import styles from './ApiErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
    onRetry?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('API Component Error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        this.props.onRetry?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.apiError}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <p className={styles.message}>
                        {this.props.fallbackMessage || 'Daten konnten nicht geladen werden'}
                    </p>
                    <button
                        className={styles.retryButton}
                        onClick={this.handleRetry}
                    >
                        Erneut versuchen
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ApiErrorBoundary;
