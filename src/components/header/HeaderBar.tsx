import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Wifi, WifiOff, Clock, Radio } from 'lucide-react';
import styles from './HeaderBar.module.css';

interface HeaderBarProps {
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastRefresh?: Date | null;
    eventCount?: number;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
    onRefresh,
    isRefreshing = false,
    lastRefresh,
    eventCount = 0
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const formatTime = (date: Date, utc: boolean = false) => {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: utc ? 'UTC' : undefined
        };
        return date.toLocaleTimeString('de-DE', options);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getLastRefreshText = () => {
        if (!lastRefresh) return 'Nie';
        // Use currentTime state instead of Date.now() for purity
        const diff = Math.floor((currentTime.getTime() - lastRefresh.getTime()) / 1000);
        if (diff < 60) return `vor ${diff}s`;
        if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
        return `vor ${Math.floor(diff / 3600)}h`;
    };

    return (
        <header className={styles.header}>
            {/* Logo Section */}
            <div className={styles.logoSection}>
                <div className={styles.logoWrapper}>
                    <div className={styles.logoGlow} />
                    <div className={styles.scanline} />
                    <Globe className={styles.logoIcon} size={28} />
                </div>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.title}>GLOBAL OBSERVER</h1>
                    <span className={styles.subtitle}>CONFLICT INTELLIGENCE</span>
                </div>
            </div>

            {/* Center Section - Live Status */}
            <div className={styles.centerSection}>
                <div className={styles.liveIndicator}>
                    <Radio className={`${styles.liveIcon} ${isRefreshing ? styles.pulsing : ''}`} size={14} />
                    <span className={styles.liveText}>LIVE</span>
                </div>
                <div className={styles.eventCounter}>
                    <span className={styles.eventCount}>{eventCount}</span>
                    <span className={styles.eventLabel}>EREIGNISSE</span>
                </div>
            </div>

            {/* Right Section - Clock & Controls */}
            <div className={styles.rightSection}>
                {/* Clock Display */}
                <div className={styles.clockSection}>
                    <div className={styles.clockRow}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span className={styles.clockLabel}>UTC</span>
                        <span className={styles.clockTime}>{formatTime(currentTime, true)}</span>
                    </div>
                    <div className={styles.clockRow}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span className={styles.clockLabel}>LOC</span>
                        <span className={styles.clockTime}>{formatTime(currentTime, false)}</span>
                    </div>
                    <div className={styles.dateRow}>
                        <span className={styles.dateText}>{formatDate(currentTime)}</span>
                    </div>
                </div>

                {/* Connection Status */}
                <div className={`${styles.connectionStatus} ${isOnline ? styles.online : styles.offline}`}>
                    {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                    <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>

                {/* Refresh Button */}
                <button
                    className={`${styles.refreshButton} ${isRefreshing ? styles.spinning : ''}`}
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title={`Letzte Aktualisierung: ${getLastRefreshText()}`}
                >
                    <RefreshCw size={18} />
                    <span className={styles.refreshText}>{getLastRefreshText()}</span>
                </button>
            </div>
        </header>
    );
};

export default HeaderBar;
