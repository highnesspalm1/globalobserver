import React, { useMemo, useState } from 'react';
import {
    Activity,
    Clock,
    AlertTriangle,
    MapPin,
    Radio,
    TrendingUp
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n } from '../../i18n';
import styles from './ActivityFeed.module.css';

interface ActivityItem {
    id: string;
    type: 'critical' | 'high' | 'new' | 'update';
    title: string;
    timeAgo: string;
    region: string;
}

export const ActivityFeed: React.FC = () => {
    const events = useMapStore((state) => state.events);
    const { t } = useI18n();

    // Stable timestamp to avoid purity violations
    const [now] = useState(() => Date.now());

    const activities = useMemo<ActivityItem[]>(() => {
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;

        return events
            .filter(e => e.eventDate.getTime() > twoHoursAgo)
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
            .slice(0, 6)
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

                // Determine type based on severity
                let type: ActivityItem['type'] = 'new';
                if (e.severity === 'critical') type = 'critical';
                else if (e.severity === 'high') type = 'high';

                // Detect region
                const text = `${e.title} ${e.description || ''}`.toLowerCase();
                let region = 'Global';
                if (text.includes('ukraine') || text.includes('russia')) region = 'UA/RU';
                else if (text.includes('gaza') || text.includes('israel')) region = 'ME';
                else if (text.includes('syria') || text.includes('iran')) region = 'ME';
                else if (text.includes('africa') || text.includes('sudan')) region = 'AF';
                else if (text.includes('asia') || text.includes('china')) region = 'AS';
                else if (text.includes('usa') || text.includes('america')) region = 'AM';

                return {
                    id: e.id,
                    type,
                    title: e.title.length > 40 ? e.title.substring(0, 40) + '...' : e.title,
                    timeAgo,
                    region
                };
            });
    }, [events, now]);

    const getTypeIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'critical':
                return <AlertTriangle size={10} />;
            case 'high':
                return <TrendingUp size={10} />;
            default:
                return <Radio size={10} />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Activity size={12} />
                <span className={styles.title}>{t.activity.title}</span>
                <span className={styles.badge}>{activities.length}</span>
            </div>

            <div className={styles.feed}>
                {activities.length === 0 ? (
                    <div className={styles.empty}>
                        <Clock size={16} />
                        <span>{t.activity.noActivity}</span>
                    </div>
                ) : (
                    activities.map(activity => (
                        <div
                            key={activity.id}
                            className={`${styles.item} ${styles[activity.type]}`}
                        >
                            <div className={styles.itemIcon}>
                                {getTypeIcon(activity.type)}
                            </div>
                            <div className={styles.itemContent}>
                                <span className={styles.itemTitle}>{activity.title}</span>
                                <div className={styles.itemMeta}>
                                    <span className={styles.itemRegion}>
                                        <MapPin size={8} />
                                        {activity.region}
                                    </span>
                                    <span className={styles.itemTime}>
                                        <Clock size={8} />
                                        {activity.timeAgo}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
