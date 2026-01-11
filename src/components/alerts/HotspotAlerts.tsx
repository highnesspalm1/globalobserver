import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Bell,
    X,
    ChevronRight,
    Clock,
    MapPin,
    Zap
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './HotspotAlerts.module.css';

interface HotspotAlert {
    id: string;
    title: string;
    region: string;
    severity: string;
    timeAgo: string;
    eventDate: Date;
    coordinates: [number, number];
}

export const HotspotAlerts: React.FC = () => {
    const events = useMapStore((state) => state.events);
    const setViewState = useMapStore((state) => state.setViewState);
    const setSelectedEventId = useMapStore((state) => state.setSelectedEventId);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    // Stable timestamp to avoid purity violations
    const [now] = useState(() => Date.now());

    const alerts = useMemo<HotspotAlert[]>(() => {
        const sixHoursAgo = now - 6 * 60 * 60 * 1000;

        // Get critical and high severity events from last 6 hours
        const recentAlerts = events
            .filter(e => {
                const eventTime = e.eventDate.getTime();
                return (
                    eventTime > sixHoursAgo &&
                    (e.severity === 'critical' || e.severity === 'high') &&
                    !dismissed.has(e.id)
                );
            })
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
            .slice(0, 5)
            .map(e => {
                const diffMs = now - e.eventDate.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);

                let timeAgo = 'gerade eben';
                if (diffHours > 0) {
                    timeAgo = `vor ${diffHours}h`;
                } else if (diffMins > 0) {
                    timeAgo = `vor ${diffMins}m`;
                }

                // Detect region from title/description
                const text = `${e.title} ${e.description || ''}`.toLowerCase();
                let region = 'Unbekannt';
                if (text.includes('ukraine') || text.includes('russia')) region = 'Ukraine/Russland';
                else if (text.includes('gaza') || text.includes('israel')) region = 'Naher Osten';
                else if (text.includes('syria')) region = 'Syrien';
                else if (text.includes('iran')) region = 'Iran';
                else if (text.includes('sudan') || text.includes('africa')) region = 'Afrika';
                else if (text.includes('asia') || text.includes('myanmar')) region = 'Asien';

                return {
                    id: e.id,
                    title: e.title,
                    region,
                    severity: e.severity,
                    timeAgo,
                    eventDate: e.eventDate,
                    coordinates: e.coordinates
                };
            });

        return recentAlerts;
    }, [events, dismissed, now]);

    const handleAlertClick = (alert: HotspotAlert) => {
        setViewState({
            longitude: alert.coordinates[0],
            latitude: alert.coordinates[1],
            zoom: 8
        });
        setSelectedEventId(alert.id);
    };

    const handleDismiss = (e: React.MouseEvent, alertId: string) => {
        e.stopPropagation();
        setDismissed(prev => new Set([...prev, alertId]));
    };

    if (alerts.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Bell size={14} />
                        <span className={styles.title}>ALERTS</span>
                    </div>
                    <span className={styles.count}>0</span>
                </div>
                <div className={styles.emptyState}>
                    <Zap size={20} />
                    <span>Keine aktuellen Hotspots</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell size={14} className={styles.bellIcon} />
                    <span className={styles.title}>HOTSPOT ALERTS</span>
                </div>
                <span className={styles.count}>{alerts.length}</span>
            </div>

            <div className={styles.alertList}>
                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`${styles.alertItem} ${styles[`severity${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}`]}`}
                        onClick={() => handleAlertClick(alert)}
                    >
                        <div className={styles.alertIcon}>
                            <AlertTriangle size={14} />
                        </div>
                        <div className={styles.alertContent}>
                            <div className={styles.alertTitle}>
                                {alert.title.length > 50 ? `${alert.title.substring(0, 50)}...` : alert.title}
                            </div>
                            <div className={styles.alertMeta}>
                                <span className={styles.alertRegion}>
                                    <MapPin size={10} />
                                    {alert.region}
                                </span>
                                <span className={styles.alertTime}>
                                    <Clock size={10} />
                                    {alert.timeAgo}
                                </span>
                            </div>
                        </div>
                        <button
                            className={styles.dismissBtn}
                            onClick={(e) => handleDismiss(e, alert.id)}
                        >
                            <X size={12} />
                        </button>
                        <ChevronRight size={14} className={styles.arrowIcon} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HotspotAlerts;
