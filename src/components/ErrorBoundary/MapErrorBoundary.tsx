// Map Error Boundary - Specialized error handling for MapView component
import { Component, type ReactNode } from 'react';
import styles from './MapErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('MapView Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.mapError}>
                    <div className={styles.errorContent}>
                        <div className={styles.icon}>🗺️</div>
                        <h2 className={styles.title}>Karten-Fehler</h2>
                        <p className={styles.message}>
                            Die Kartenansicht konnte nicht geladen werden.
                        </p>
                        {this.state.error && (
                            <details className={styles.details}>
                                <summary>Technische Details</summary>
                                <pre>{this.state.error.message}</pre>
                            </details>
                        )}
                        <div className={styles.actions}>
                            <button
                                className={styles.resetButton}
                                onClick={this.handleReset}
                            >
                                Karte neu laden
                            </button>
                            <button
                                className={styles.reloadButton}
                                onClick={() => window.location.reload()}
                            >
                                Seite neu laden
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;
