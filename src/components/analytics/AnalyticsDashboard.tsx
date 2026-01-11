import React, { useMemo, useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    PieChart,
    Activity
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '../../types/database';
import type { EventCategory, SeverityLevel } from '../../types/database';
import styles from './AnalyticsDashboard.module.css';

interface DayStats {
    date: string;
    count: number;
}

const AnalyticsDashboard: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const events = useMapStore((state) => state.events);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Events by day (last 7 days)
        const dayStats: DayStats[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = events.filter(e => {
                const eventDate = e.eventDate.toISOString().split('T')[0];
                return eventDate === dateStr;
            });
            dayStats.push({
                date: date.toLocaleDateString('de-DE', { weekday: 'short' }),
                count: dayEvents.length
            });
        }

        // Category distribution
        const categoryStats: Record<string, number> = {};
        events.forEach(e => {
            categoryStats[e.category] = (categoryStats[e.category] || 0) + 1;
        });

        // Severity distribution
        const severityStats: Record<string, number> = {};
        events.forEach(e => {
            severityStats[e.severity] = (severityStats[e.severity] || 0) + 1;
        });

        // Trend calculation (this week vs last week)
        const thisWeekEvents = events.filter(e => e.eventDate >= sevenDaysAgo);
        const lastWeekEvents = events.filter(e =>
            e.eventDate >= fourteenDaysAgo && e.eventDate < sevenDaysAgo
        );

        const trend = thisWeekEvents.length - lastWeekEvents.length;
        const trendPercent = lastWeekEvents.length > 0
            ? Math.round((trend / lastWeekEvents.length) * 100)
            : 0;

        return {
            total: events.length,
            dayStats,
            categoryStats,
            severityStats,
            thisWeek: thisWeekEvents.length,
            lastWeek: lastWeekEvents.length,
            trend,
            trendPercent
        };
    }, [events]);

    const maxDayCount = Math.max(...stats.dayStats.map(d => d.count), 1);
    const topCategories = Object.entries(stats.categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (!isOpen) {
        return (
            <button
                className={styles.toggleButton}
                onClick={() => setIsOpen(true)}
                title="Analytics Dashboard"
            >
                <BarChart3 size={16} />
            </button>
        );
    }

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.dashboard} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <BarChart3 size={18} />
                        <span>ANALYTICS DASHBOARD</span>
                    </div>
                    <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Summary Cards */}
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Gesamt Ereignisse</span>
                            <span className={styles.cardValue}>{stats.total}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Diese Woche</span>
                            <span className={styles.cardValue}>{stats.thisWeek}</span>
                        </div>
                        <div className={`${styles.summaryCard} ${styles.trendCard}`}>
                            <span className={styles.cardLabel}>7-Tage Trend</span>
                            <div className={styles.trendValue}>
                                {stats.trend > 0 ? (
                                    <TrendingUp className={styles.trendUp} size={20} />
                                ) : stats.trend < 0 ? (
                                    <TrendingDown className={styles.trendDown} size={20} />
                                ) : (
                                    <Minus className={styles.trendNeutral} size={20} />
                                )}
                                <span className={stats.trend > 0 ? styles.trendUp : stats.trend < 0 ? styles.trendDown : ''}>
                                    {stats.trend > 0 ? '+' : ''}{stats.trendPercent}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className={styles.chartsRow}>
                        {/* Daily Activity Chart */}
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>
                                <Activity size={14} />
                                Aktivität (7 Tage)
                            </h3>
                            <div className={styles.barChart}>
                                {stats.dayStats.map((day, index) => (
                                    <div key={index} className={styles.barItem}>
                                        <div className={styles.barWrapper}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    height: `${(day.count / maxDayCount) * 100}%`,
                                                    animationDelay: `${index * 50}ms`
                                                }}
                                            />
                                        </div>
                                        <span className={styles.barLabel}>{day.date}</span>
                                        <span className={styles.barValue}>{day.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category Distribution */}
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>
                                <PieChart size={14} />
                                Top Kategorien
                            </h3>
                            <div className={styles.categoryList}>
                                {topCategories.map(([category, count], index) => {
                                    const config = CATEGORY_CONFIG[category as EventCategory];
                                    const percent = Math.round((count / stats.total) * 100);
                                    return (
                                        <div key={category} className={styles.categoryItem}>
                                            <div className={styles.categoryInfo}>
                                                <div
                                                    className={styles.categoryDot}
                                                    style={{ backgroundColor: config?.color || '#666' }}
                                                />
                                                <span className={styles.categoryName}>
                                                    {config?.label || category}
                                                </span>
                                            </div>
                                            <div className={styles.categoryBar}>
                                                <div
                                                    className={styles.categoryProgress}
                                                    style={{
                                                        width: `${percent}%`,
                                                        backgroundColor: config?.color || '#666',
                                                        animationDelay: `${index * 100}ms`
                                                    }}
                                                />
                                            </div>
                                            <span className={styles.categoryCount}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Severity Distribution */}
                    <div className={styles.severityRow}>
                        <h3 className={styles.chartTitle}>Schweregrad-Verteilung</h3>
                        <div className={styles.severityGrid}>
                            {(['critical', 'high', 'medium', 'low'] as SeverityLevel[]).map(severity => {
                                const count = stats.severityStats[severity] || 0;
                                const config = SEVERITY_CONFIG[severity];
                                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                return (
                                    <div key={severity} className={styles.severityItem}>
                                        <div
                                            className={styles.severityIndicator}
                                            style={{ backgroundColor: config.color }}
                                        />
                                        <div className={styles.severityInfo}>
                                            <span className={styles.severityLabel}>{config.label}</span>
                                            <span className={styles.severityCount}>{count}</span>
                                        </div>
                                        <span className={styles.severityPercent}>{percent}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
