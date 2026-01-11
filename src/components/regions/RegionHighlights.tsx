import React, { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronRight,
    Globe
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n } from '../../i18n';
import styles from './RegionHighlights.module.css';

interface RegionData {
    id: string;
    name: string;
    flag: string;
    color: string;
    keywords: string[];
    eventCount: number;
    criticalCount: number;
    trend: 'up' | 'down' | 'stable';
}

const REGION_CONFIGS = [
    {
        id: 'ukraine-russia',
        name: 'Ukraine/Russland',
        flag: '🇺🇦',
        color: '#eab308',
        keywords: ['ukraine', 'russia', 'kyiv', 'moscow', 'donbas', 'crimea', 'kursk', 'kharkiv']
    },
    {
        id: 'middle-east',
        name: 'Naher Osten',
        flag: '🌍',
        color: '#dc2626',
        keywords: ['gaza', 'israel', 'syria', 'iran', 'lebanon', 'yemen', 'iraq', 'jerusalem', 'hamas']
    },
    {
        id: 'africa',
        name: 'Afrika',
        flag: '🌍',
        color: '#ea580c',
        keywords: ['sudan', 'ethiopia', 'nigeria', 'mali', 'sahel', 'congo', 'somalia', 'libya']
    },
    {
        id: 'asia',
        name: 'Asien',
        flag: '🌏',
        color: '#0284c7',
        keywords: ['myanmar', 'china', 'taiwan', 'india', 'pakistan', 'kashmir', 'philippines', 'thailand', 'korea']
    },
    {
        id: 'americas',
        name: 'Amerika',
        flag: '🌎',
        color: '#16a34a',
        keywords: ['mexico', 'venezuela', 'haiti', 'brazil', 'colombia', 'usa', 'washington']
    }
];

export const RegionHighlights: React.FC = () => {
    const { t } = useI18n();
    const events = useMapStore((state) => state.events);
    const setViewState = useMapStore((state) => state.setViewState);

    const regions = useMemo<RegionData[]>(() => {
        return REGION_CONFIGS.map(config => {
            const matchingEvents = events.filter(e => {
                const text = `${e.title} ${e.description || ''}`.toLowerCase();
                return config.keywords.some(kw => text.includes(kw));
            });

            const criticalCount = matchingEvents.filter(e => e.severity === 'critical').length;

            // Simple trend simulation based on event count
            const trend: 'up' | 'down' | 'stable' =
                criticalCount > 3 ? 'up' :
                    matchingEvents.length > 10 ? 'up' :
                        matchingEvents.length < 3 ? 'down' : 'stable';

            return {
                ...config,
                eventCount: matchingEvents.length,
                criticalCount,
                trend
            };
        });
    }, [events]);

    const handleRegionClick = (regionId: string) => {
        // Navigate to region based on ID
        const coords: Record<string, { lng: number; lat: number; zoom: number }> = {
            'ukraine-russia': { lng: 35, lat: 49, zoom: 5 },
            'middle-east': { lng: 40, lat: 30, zoom: 4 },
            'africa': { lng: 20, lat: 5, zoom: 3.5 },
            'asia': { lng: 100, lat: 25, zoom: 3.5 },
            'americas': { lng: -80, lat: 15, zoom: 3 }
        };

        const target = coords[regionId];
        if (target) {
            setViewState({
                longitude: target.lng,
                latitude: target.lat,
                zoom: target.zoom
            });
        }
    };

    const totalEvents = regions.reduce((sum, r) => sum + r.eventCount, 0);
    const topRegion = [...regions].sort((a, b) => b.eventCount - a.eventCount)[0];

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up':
                return <TrendingUp size={10} className={styles.trendUp} />;
            case 'down':
                return <TrendingDown size={10} className={styles.trendDown} />;
            default:
                return <Minus size={10} className={styles.trendStable} />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Globe size={14} />
                    <span className={styles.title}>REGIONEN</span>
                </div>
                <span className={styles.totalBadge}>{totalEvents} {t.events.title}</span>
            </div>

            {topRegion && topRegion.eventCount > 0 && (
                <div
                    className={styles.topRegion}
                    style={{ '--region-color': topRegion.color } as React.CSSProperties}
                    onClick={() => handleRegionClick(topRegion.id)}
                >
                    <span className={styles.topFlag}>{topRegion.flag}</span>
                    <div className={styles.topInfo}>
                        <span className={styles.topName}>{topRegion.name}</span>
                        <span className={styles.topLabel}>{t.regions.mostActive}</span>
                    </div>
                    <div className={styles.topCount}>
                        <span>{topRegion.eventCount}</span>
                        {getTrendIcon(topRegion.trend)}
                    </div>
                </div>
            )}

            <div className={styles.regionList}>
                {regions.map(region => (
                    <button
                        key={region.id}
                        className={styles.regionItem}
                        style={{ '--region-color': region.color } as React.CSSProperties}
                        onClick={() => handleRegionClick(region.id)}
                    >
                        <span className={styles.regionFlag}>{region.flag}</span>
                        <span className={styles.regionName}>{region.name}</span>
                        <div className={styles.regionStats}>
                            {region.criticalCount > 0 && (
                                <span className={styles.criticalBadge}>
                                    {region.criticalCount}
                                </span>
                            )}
                            <span className={styles.eventBadge}>{region.eventCount}</span>
                            {getTrendIcon(region.trend)}
                            <ChevronRight size={12} className={styles.regionArrow} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RegionHighlights;
