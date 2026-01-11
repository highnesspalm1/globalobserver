import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Wifi, WifiOff, Clock, Radio } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
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
    const { t, language } = useI18n();
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
        const locale = language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : 'en-GB';
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: utc ? 'UTC' : undefined
        };
        return date.toLocaleTimeString(locale, options);
    };

    const formatDate = (date: Date) => {
        const locale = language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : 'en-GB';
        return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getLastRefreshText = () => {
        if (!lastRefresh) return t.time.never;
        const diff = Math.floor((currentTime.getTime() - lastRefresh.getTime()) / 1000);
        if (diff < 60) return t.time.secondsAgo.replace('{n}', String(diff));
        if (diff < 3600) return t.time.minutesAgo.replace('{n}', String(Math.floor(diff / 60)));
        return t.time.hoursAgo.replace('{n}', String(Math.floor(diff / 3600)));
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
                    <h1 className={styles.title}>{t.app.title}</h1>
                    <span className={styles.subtitle}>{t.app.subtitle}</span>
                </div>
            </div>

            {/* Center Section - Live Status */}
            <div className={styles.centerSection}>
                <div className={styles.liveIndicator}>
                    <Radio className={`${styles.liveIcon} ${isRefreshing ? styles.pulsing : ''}`} size={14} />
                    <span className={styles.liveText}>{t.header.live}</span>
                </div>
                <div className={styles.eventCounter}>
                    <span className={styles.eventCount}>{eventCount}</span>
                    <span className={styles.eventLabel}>{t.header.events}</span>
                </div>
            </div>

            {/* Right Section - Clock & Controls */}
            <div className={styles.rightSection}>
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Clock Display */}
                <div className={styles.clockSection}>
                    <div className={styles.clockRow}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span className={styles.clockLabel}>UTC</span>
                        <span className={styles.clockTime}>{formatTime(currentTime, true)}</span>
                    </div>
                    <div className={styles.clockRow}>
                        <Clock size={12} className={styles.clockIcon} />
                        <span className={styles.clockLabel}>{t.header.localTime}</span>
                        <span className={styles.clockTime}>{formatTime(currentTime, false)}</span>
                    </div>
                    <div className={styles.dateRow}>
                        <span className={styles.dateText}>{formatDate(currentTime)}</span>
                    </div>
                </div>

                {/* Connection Status */}
                <div className={`${styles.connectionStatus} ${isOnline ? styles.online : styles.offline}`}>
                    {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                    <span>{isOnline ? t.header.online : t.header.offline}</span>
                </div>

                {/* Refresh Button */}
                <button
                    className={`${styles.refreshButton} ${isRefreshing ? styles.spinning : ''}`}
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title={`${t.header.lastUpdate}: ${getLastRefreshText()}`}
                >
                    <RefreshCw size={18} />
                    <span className={styles.refreshText}>{getLastRefreshText()}</span>
                </button>
            </div>
        </header>
    );
};

export default HeaderBar;
