import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './ConflictStats.module.css';

interface RegionStats {
    id: string;
    name: string;
    flag: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    critical: number;
    high: number;
}

const REGION_CONFIG: Record<string, { name: string; flag: string; bounds: [number, number, number, number] }> = {
    'ukraine-russia': { name: 'Ukraine/Russland', flag: '🇺🇦', bounds: [22, 44, 45, 53] },
    'middle-east': { name: 'Naher Osten', flag: '🇸🇾', bounds: [34, 12, 64, 42] },
    'africa': { name: 'Afrika', flag: '🌍', bounds: [-18, -35, 52, 25] },
    'asia': { name: 'Asien', flag: '🌏', bounds: [60, 5, 145, 45] },
    'americas': { name: 'Amerika', flag: '🌎', bounds: [-130, -55, -30, 50] },
};

const ConflictStats: React.FC = () => {
    const events = useMapStore((state) => state.events);

    const regionStats = useMemo(() => {
        const stats: RegionStats[] = [];

        Object.entries(REGION_CONFIG).forEach(([id, config]) => {
            const regionEvents = events.filter(event => {
                const [minLng, minLat, maxLng, maxLat] = config.bounds;
                const [lng, lat] = event.coordinates;
                return lng >= minLng &&
                    lng <= maxLng &&
                    lat >= minLat &&
                    lat <= maxLat;
            });

            const criticalCount = regionEvents.filter(e => e.severity === 'critical').length;
            const highCount = regionEvents.filter(e => e.severity === 'high').length;

            // Simulate trend based on severity distribution
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (criticalCount > 2) trend = 'up';
            else if (highCount > 3) trend = 'up';
            else if (regionEvents.length < 3) trend = 'down';

            stats.push({
                id,
                name: config.name,
                flag: config.flag,
                count: regionEvents.length,
                trend,
                critical: criticalCount,
                high: highCount,
            });
        });

        // Sort by count descending
        return stats.sort((a, b) => b.count - a.count);
    }, [events]);

    const totalEvents = events.length;
    const totalCritical = events.filter(e => e.severity === 'critical').length;
    const totalHigh = events.filter(e => e.severity === 'high').length;

    const maxCount = Math.max(...regionStats.map(r => r.count), 1);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Activity size={14} />
                    <span>KONFLIKT-STATISTIKEN</span>
                </div>
            </div>

            {/* Summary Row */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryValue}>{totalEvents}</span>
                    <span className={styles.summaryLabel}>GESAMT</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={`${styles.summaryValue} ${styles.critical}`}>{totalCritical}</span>
                    <span className={styles.summaryLabel}>KRITISCH</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={`${styles.summaryValue} ${styles.high}`}>{totalHigh}</span>
                    <span className={styles.summaryLabel}>HOCH</span>
                </div>
            </div>

            {/* Region List */}
            <div className={styles.regionList}>
                {regionStats.slice(0, 5).map((region, index) => (
                    <div
                        key={region.id}
                        className={styles.regionItem}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className={styles.regionInfo}>
                            <span className={styles.regionFlag}>{region.flag}</span>
                            <span className={styles.regionName}>{region.name}</span>
                            {region.trend === 'up' && (
                                <TrendingUp size={12} className={styles.trendUp} />
                            )}
                            {region.trend === 'down' && (
                                <TrendingDown size={12} className={styles.trendDown} />
                            )}
                            {region.trend === 'stable' && (
                                <Minus size={12} className={styles.trendStable} />
                            )}
                        </div>

                        <div className={styles.regionStats}>
                            <div className={styles.barContainer}>
                                <div
                                    className={styles.bar}
                                    style={{
                                        width: `${(region.count / maxCount) * 100}%`,
                                        animationDelay: `${index * 100 + 200}ms`
                                    }}
                                />
                            </div>
                            <div className={styles.countBadges}>
                                {region.critical > 0 && (
                                    <span className={`${styles.badge} ${styles.badgeCritical}`}>
                                        <AlertTriangle size={10} />
                                        {region.critical}
                                    </span>
                                )}
                                <span className={styles.totalCount}>
                                    <MapPin size={10} />
                                    {region.count}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConflictStats;
