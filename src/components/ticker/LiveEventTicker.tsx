import React, { useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Zap,
    Radio,
    ChevronRight,
    Pause,
    Play
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './LiveEventTicker.module.css';

interface TickerEvent {
    id: string;
    title: string;
    severity: string;
    region: string;
    timeAgo: string;
    coordinates: [number, number];
}

export const LiveEventTicker: React.FC = () => {
    const events = useMapStore((state) => state.events);
    const setViewState = useMapStore((state) => state.setViewState);
    const setSelectedEventId = useMapStore((state) => state.setSelectedEventId);
    const [isPaused, setIsPaused] = useState(false);
    const tickerRef = useRef<HTMLDivElement>(null);

    // Stable timestamp to avoid purity violations
    const [now] = useState(() => Date.now());

    // Get recent critical and high events for ticker
    const tickerEvents = useMemo<TickerEvent[]>(() => {
        const twelveHoursAgo = now - 12 * 60 * 60 * 1000;

        return events
            .filter(e => {
                const eventTime = e.eventDate.getTime();
                return eventTime > twelveHoursAgo &&
                    (e.severity === 'critical' || e.severity === 'high');
            })
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
            .slice(0, 15)
            .map(e => {
                const diffMs = now - e.eventDate.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);

                let timeAgo = 'jetzt';
                if (diffHours > 0) {
                    timeAgo = `${diffHours}h`;
                } else if (diffMins > 0) {
                    timeAgo = `${diffMins}m`;
                }

                // Detect region
                const text = `${e.title} ${e.description || ''}`.toLowerCase();
                let region = '';
                if (text.includes('ukraine') || text.includes('russia')) region = '🇺🇦';
                else if (text.includes('gaza') || text.includes('israel')) region = '🇮🇱';
                else if (text.includes('syria')) region = '🇸🇾';
                else if (text.includes('iran')) region = '🇮🇷';
                else if (text.includes('africa') || text.includes('sudan')) region = '🌍';
                else region = '🌐';

                return {
                    id: e.id,
                    title: e.title.length > 60 ? e.title.substring(0, 60) + '...' : e.title,
                    severity: e.severity,
                    region,
                    timeAgo,
                    coordinates: e.coordinates
                };
            });
    }, [events, now]);

    const handleEventClick = (event: TickerEvent) => {
        setViewState({
            longitude: event.coordinates[0],
            latitude: event.coordinates[1],
            zoom: 8
        });
        setSelectedEventId(event.id);
    };

    if (tickerEvents.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.container}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={styles.labelSection}>
                <Radio size={12} className={styles.liveIcon} />
                <span className={styles.label}>LIVE</span>
            </div>

            <div className={styles.tickerWrapper}>
                <div
                    ref={tickerRef}
                    className={`${styles.ticker} ${isPaused ? styles.tickerPaused : ''}`}
                >
                    {/* Duplicate events for seamless loop */}
                    {[...tickerEvents, ...tickerEvents].map((event, index) => (
                        <button
                            key={`${event.id}-${index}`}
                            className={`${styles.tickerItem} ${styles[`severity${event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}`]}`}
                            onClick={() => handleEventClick(event)}
                        >
                            <span className={styles.eventIcon}>
                                {event.severity === 'critical' ? (
                                    <AlertTriangle size={12} />
                                ) : (
                                    <Zap size={12} />
                                )}
                            </span>
                            <span className={styles.eventRegion}>{event.region}</span>
                            <span className={styles.eventTitle}>{event.title}</span>
                            <span className={styles.eventTime}>{event.timeAgo}</span>
                            <ChevronRight size={12} className={styles.eventArrow} />
                        </button>
                    ))}
                </div>
            </div>

            <button
                className={styles.pauseButton}
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Fortsetzen' : 'Pausieren'}
            >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
        </div>
    );
};

export default LiveEventTicker;
