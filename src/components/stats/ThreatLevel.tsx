import React, { useMemo } from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './ThreatLevel.module.css';

type ThreatLevelType = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'SEVERE';

interface ThreatConfig {
    level: number;
    label: string;
    labelDe: string;
    color: string;
    bgColor: string;
    description: string;
}

const THREAT_LEVELS: Record<ThreatLevelType, ThreatConfig> = {
    LOW: {
        level: 5,
        label: 'LOW',
        labelDe: 'NIEDRIG',
        color: '#16a34a',
        bgColor: 'rgba(22, 163, 74, 0.15)',
        description: 'Geringe Bedrohungslage'
    },
    GUARDED: {
        level: 4,
        label: 'GUARDED',
        labelDe: 'BEWACHT',
        color: '#0284c7',
        bgColor: 'rgba(2, 132, 199, 0.15)',
        description: 'Allgemeine Bedrohung möglich'
    },
    ELEVATED: {
        level: 3,
        label: 'ELEVATED',
        labelDe: 'ERHÖHT',
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.15)',
        description: 'Signifikante Bedrohungslage'
    },
    HIGH: {
        level: 2,
        label: 'HIGH',
        labelDe: 'HOCH',
        color: '#ea580c',
        bgColor: 'rgba(234, 88, 12, 0.15)',
        description: 'Hohe Bedrohungswahrscheinlichkeit'
    },
    SEVERE: {
        level: 1,
        label: 'SEVERE',
        labelDe: 'KRITISCH',
        color: '#dc2626',
        bgColor: 'rgba(220, 38, 38, 0.15)',
        description: 'Akute Bedrohungslage'
    }
};

export const ThreatLevel: React.FC = () => {
    const events = useMapStore((state) => state.events);

    // Use stable timestamp to avoid purity violations
    const [now] = React.useState(() => Date.now());

    // Calculate threat level based on critical/high severity events
    const { threatLevel, stats } = useMemo(() => {
        const criticalCount = events.filter(e => e.severity === 'critical').length;
        const highCount = events.filter(e => e.severity === 'high').length;
        const hourAgo = now - 60 * 60 * 1000;
        const recentCritical = events.filter(e => {
            return e.severity === 'critical' && e.eventDate.getTime() > hourAgo;
        }).length;

        let level: ThreatLevelType = 'LOW';

        if (recentCritical >= 5 || criticalCount >= 20) {
            level = 'SEVERE';
        } else if (recentCritical >= 3 || criticalCount >= 10) {
            level = 'HIGH';
        } else if (criticalCount >= 5 || highCount >= 15) {
            level = 'ELEVATED';
        } else if (criticalCount >= 2 || highCount >= 5) {
            level = 'GUARDED';
        }

        return {
            threatLevel: THREAT_LEVELS[level],
            stats: { criticalCount, highCount, recentCritical }
        };
    }, [events, now]);

    const barSegments = 10;
    const filledSegments = Math.round((6 - threatLevel.level) / 5 * barSegments);

    return (
        <div
            className={styles.container}
            style={{
                '--threat-color': threatLevel.color,
                '--threat-bg': threatLevel.bgColor
            } as React.CSSProperties}
        >
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Shield size={16} />
                </div>
                <span className={styles.title}>THREAT LEVEL</span>
            </div>

            <div className={styles.levelDisplay}>
                <div className={styles.levelBar}>
                    {[...Array(barSegments)].map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.barSegment} ${i < filledSegments ? styles.barSegmentFilled : ''}`}
                            style={{
                                animationDelay: `${i * 50}ms`,
                                backgroundColor: i < filledSegments ? threatLevel.color : undefined
                            }}
                        />
                    ))}
                </div>

                <div className={styles.levelInfo}>
                    <span className={styles.levelNumber}>STUFE {threatLevel.level}</span>
                    <span className={styles.levelLabel}>{threatLevel.labelDe}</span>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <AlertTriangle size={12} />
                    <span>{stats.criticalCount}</span>
                    <span className={styles.statLabel}>Kritisch</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                    <Activity size={12} />
                    <span>{stats.highCount}</span>
                    <span className={styles.statLabel}>Hoch</span>
                </div>
            </div>

            <div className={styles.description}>
                {threatLevel.description}
            </div>
        </div>
    );
};

export default ThreatLevel;
