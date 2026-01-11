import React, { useState, useEffect, useCallback } from 'react';
import {
    Database,
    Rss,
    Globe,
    CheckCircle,
    XCircle,
    RefreshCw,
    Clock,
    Wifi,
    WifiOff
} from 'lucide-react';
import styles from './DataSourceStatus.module.css';

interface DataSourceInfo {
    id: string;
    name: string;
    type: 'api' | 'rss' | 'feed';
    status: 'online' | 'offline' | 'degraded' | 'checking';
    lastUpdate: Date | null;
    eventsCount: number;
}

// Store last known status
let lastKnownSources: DataSourceInfo[] = [];
let lastRefreshTime: Date | null = null;

export const DataSourceStatus: React.FC = () => {
    // Initialize with last known sources to avoid setState in useEffect
    const [sources, setSources] = useState<DataSourceInfo[]>(lastKnownSources);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(lastRefreshTime);

    // Track if initial check has been done
    const initialCheckDone = React.useRef(lastKnownSources.length > 0);

    const checkSources = useCallback(async () => {
        setIsRefreshing(true);

        // Simulated source checking based on actual services
        const sourcesList: DataSourceInfo[] = [
            {
                id: 'gdelt',
                name: 'GDELT GEO',
                type: 'api',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 16
            },
            {
                id: 'reliefweb',
                name: 'ReliefWeb',
                type: 'api',
                status: 'degraded', // Currently returning 403
                lastUpdate: null,
                eventsCount: 0
            },
            {
                id: 'bbc',
                name: 'BBC World',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 25
            },
            {
                id: 'aljazeera',
                name: 'Al Jazeera',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 18
            },
            {
                id: 'guardian',
                name: 'The Guardian',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 22
            },
            {
                id: 'dw',
                name: 'Deutsche Welle',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 15
            },
            {
                id: 'kyiv',
                name: 'Kyiv Independent',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 12
            },
            {
                id: 'toi',
                name: 'Times of Israel',
                type: 'rss',
                status: 'online',
                lastUpdate: new Date(),
                eventsCount: 14
            }
        ];

        setTimeout(() => {
            setSources(sourcesList);
            lastKnownSources = sourcesList;
            const now = new Date();
            setLastRefresh(now);
            lastRefreshTime = now;
            setIsRefreshing(false);
        }, 500);
    }, []);

    // Initial check on mount - use effect but only for external subscription pattern
    useEffect(() => {
        if (!initialCheckDone.current) {
            initialCheckDone.current = true;
            // Defer to avoid synchronous setState in effect
            const timer = setTimeout(checkSources, 0);
            return () => clearTimeout(timer);
        }
    }, [checkSources]);

    const onlineCount = sources.filter(s => s.status === 'online').length;
    const totalCount = sources.length;
    const totalEvents = sources.reduce((sum, s) => sum + s.eventsCount, 0);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'online':
                return <CheckCircle size={12} className={styles.statusOnline} />;
            case 'offline':
                return <XCircle size={12} className={styles.statusOffline} />;
            case 'degraded':
                return <WifiOff size={12} className={styles.statusDegraded} />;
            default:
                return <RefreshCw size={12} className={styles.statusChecking} />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'api':
                return <Database size={12} />;
            case 'rss':
                return <Rss size={12} />;
            default:
                return <Globe size={12} />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Wifi size={14} />
                    <span className={styles.title}>DATENQUELLEN</span>
                </div>
                <button
                    className={`${styles.refreshBtn} ${isRefreshing ? styles.refreshing : ''}`}
                    onClick={checkSources}
                    disabled={isRefreshing}
                >
                    <RefreshCw size={12} />
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{onlineCount}/{totalCount}</span>
                    <span className={styles.summaryLabel}>Online</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{totalEvents}</span>
                    <span className={styles.summaryLabel}>Events</span>
                </div>
            </div>

            <div className={styles.sourceList}>
                {sources.map(source => (
                    <div key={source.id} className={styles.sourceItem}>
                        <div className={styles.sourceInfo}>
                            <span className={styles.sourceType}>{getTypeIcon(source.type)}</span>
                            <span className={styles.sourceName}>{source.name}</span>
                        </div>
                        <div className={styles.sourceStatus}>
                            {source.eventsCount > 0 && (
                                <span className={styles.eventCount}>{source.eventsCount}</span>
                            )}
                            {getStatusIcon(source.status)}
                        </div>
                    </div>
                ))}
            </div>

            {lastRefresh && (
                <div className={styles.footer}>
                    <Clock size={10} />
                    <span>Aktualisiert: {lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}
        </div>
    );
};

export default DataSourceStatus;
