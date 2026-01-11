import React, { useMemo } from 'react';
import {
    Globe,
    Target,
    Maximize2
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './MiniMap.module.css';

// Simplified world map representation
const REGIONS = [
    { id: 'europe', name: 'Europa', x: 52, y: 28, keywords: ['europe', 'germany', 'france', 'uk', 'ukraine', 'russia'] },
    { id: 'middle-east', name: 'Naher Osten', x: 58, y: 38, keywords: ['israel', 'gaza', 'syria', 'iran', 'iraq', 'lebanon'] },
    { id: 'asia', name: 'Asien', x: 75, y: 35, keywords: ['china', 'india', 'pakistan', 'myanmar', 'korea', 'taiwan'] },
    { id: 'africa', name: 'Afrika', x: 52, y: 52, keywords: ['sudan', 'ethiopia', 'nigeria', 'sahel', 'mali', 'congo'] },
    { id: 'americas', name: 'Amerika', x: 25, y: 40, keywords: ['usa', 'mexico', 'venezuela', 'brazil', 'haiti'] },
];

const REGION_COORDS: Record<string, { lng: number; lat: number; zoom: number }> = {
    'europe': { lng: 15, lat: 50, zoom: 4 },
    'middle-east': { lng: 42, lat: 30, zoom: 4 },
    'asia': { lng: 100, lat: 30, zoom: 3 },
    'africa': { lng: 20, lat: 5, zoom: 3.5 },
    'americas': { lng: -80, lat: 20, zoom: 3 },
};

export const MiniMap: React.FC = () => {
    const events = useMapStore((state) => state.events);
    const viewState = useMapStore((state) => state.viewState);
    const setViewState = useMapStore((state) => state.setViewState);

    // Calculate event density per region
    const regionData = useMemo(() => {
        const data: Record<string, { count: number; hasCritical: boolean }> = {};

        REGIONS.forEach(region => {
            const matchingEvents = events.filter(e => {
                const text = `${e.title} ${e.description || ''}`.toLowerCase();
                return region.keywords.some(kw => text.includes(kw));
            });

            data[region.id] = {
                count: matchingEvents.length,
                hasCritical: matchingEvents.some(e => e.severity === 'critical')
            };
        });

        return data;
    }, [events]);

    // Calculate current viewport indicator position
    const viewportPos = useMemo(() => {
        // Simple mercator-like projection
        const lng = viewState.longitude;
        const lat = viewState.latitude;
        const x = ((lng + 180) / 360) * 100;
        const y = ((90 - lat) / 180) * 100;
        return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }, [viewState.longitude, viewState.latitude]);

    const handleRegionClick = (regionId: string) => {
        const target = REGION_COORDS[regionId];
        if (target) {
            setViewState({
                longitude: target.lng,
                latitude: target.lat,
                zoom: target.zoom
            });
        }
    };

    const handleReset = () => {
        setViewState({
            longitude: 25,
            latitude: 30,
            zoom: 2.5
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Globe size={12} />
                <span className={styles.title}>RADAR</span>
            </div>

            <div className={styles.mapWrapper}>
                {/* Simplified world outline */}
                <svg viewBox="0 0 100 80" className={styles.worldSvg}>
                    {/* Continental shapes - very simplified */}
                    <path
                        d="M10,25 Q15,20 25,22 Q35,18 40,25 Q45,28 40,35 Q30,40 20,38 Q10,35 10,25"
                        fill="var(--bg-elevated)"
                        stroke="var(--border-default)"
                        strokeWidth="0.3"
                    />
                    {/* Europe */}
                    <path
                        d="M48,20 Q52,15 58,18 Q65,20 62,28 Q55,32 48,28 Q45,25 48,20"
                        fill="var(--bg-elevated)"
                        stroke="var(--border-default)"
                        strokeWidth="0.3"
                    />
                    {/* Africa */}
                    <path
                        d="M48,35 Q55,32 58,38 Q60,50 55,58 Q48,62 45,55 Q42,45 48,35"
                        fill="var(--bg-elevated)"
                        stroke="var(--border-default)"
                        strokeWidth="0.3"
                    />
                    {/* Asia */}
                    <path
                        d="M60,18 Q75,15 85,20 Q90,28 88,38 Q82,45 75,42 Q65,38 62,28 Q60,22 60,18"
                        fill="var(--bg-elevated)"
                        stroke="var(--border-default)"
                        strokeWidth="0.3"
                    />
                    {/* Australia */}
                    <path
                        d="M78,55 Q85,52 88,58 Q87,65 80,65 Q75,62 78,55"
                        fill="var(--bg-elevated)"
                        stroke="var(--border-default)"
                        strokeWidth="0.3"
                    />
                </svg>

                {/* Region hotspots */}
                {REGIONS.map(region => {
                    const data = regionData[region.id];
                    if (!data || data.count === 0) return null;

                    return (
                        <button
                            key={region.id}
                            className={`${styles.hotspot} ${data.hasCritical ? styles.hotspotCritical : ''}`}
                            style={{ left: `${region.x}%`, top: `${region.y}%` }}
                            onClick={() => handleRegionClick(region.id)}
                            title={`${region.name}: ${data.count} Events`}
                        >
                            <span className={styles.hotspotCount}>{data.count}</span>
                        </button>
                    );
                })}

                {/* Current viewport indicator */}
                <div
                    className={styles.viewport}
                    style={{ left: `${viewportPos.x}%`, top: `${viewportPos.y}%` }}
                >
                    <Target size={10} />
                </div>
            </div>

            <button className={styles.resetButton} onClick={handleReset}>
                <Maximize2 size={10} />
                <span>Global</span>
            </button>
        </div>
    );
};

export default MiniMap;
