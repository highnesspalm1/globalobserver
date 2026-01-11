import React, { useState, useEffect } from 'react';
import {
    Activity,
    HardDrive,
    Wifi,
    Cpu,
    Clock,
    Database,
    Zap,
    RefreshCw
} from 'lucide-react';
import styles from './SystemStatus.module.css';

interface SystemMetrics {
    memory: { used: number; total: number };
    latency: number;
    fps: number;
    connections: number;
    uptime: number;
}

const SystemStatus: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetrics>({
        memory: { used: 0, total: 0 },
        latency: 0,
        fps: 60,
        connections: 0,
        uptime: 0
    });
    const [startTime] = useState(() => Date.now());

    // Update metrics periodically
    useEffect(() => {
        const updateMetrics = () => {
            // Memory estimation using performance API
            const perf = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } });
            const memory = perf?.memory || null;

            // Simulated network latency (would need actual ping in production)
            const latency = Math.floor(Math.random() * 30) + 20;

            // Calculate uptime
            const uptime = Math.floor((Date.now() - startTime) / 1000);

            setMetrics({
                memory: memory
                    ? { used: Math.floor(memory.usedJSHeapSize / 1024 / 1024), total: Math.floor(memory.jsHeapSizeLimit / 1024 / 1024) }
                    : { used: 85, total: 512 },
                latency,
                fps: 60,
                connections: 4,
                uptime
            });
        };

        updateMetrics();
        const interval = setInterval(updateMetrics, 2000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatUptime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getLatencyStatus = (ms: number): string => {
        if (ms < 50) return 'good';
        if (ms < 100) return 'medium';
        return 'poor';
    };

    const memoryPercent = metrics.memory.total > 0
        ? (metrics.memory.used / metrics.memory.total) * 100
        : 0;

    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                {/* Left Section - System Info */}
                <div className={styles.leftSection}>
                    <div className={styles.versionBadge}>
                        <Zap size={10} />
                        <span>v2.1.0</span>
                    </div>
                    <span className={styles.buildInfo}>BUILD 2026.01.11</span>
                </div>

                {/* Center Section - Metrics */}
                <div className={styles.metricsSection}>
                    {/* Memory */}
                    <div className={styles.metric}>
                        <HardDrive size={12} className={styles.metricIcon} />
                        <span className={styles.metricLabel}>MEM</span>
                        <div className={styles.memoryBar}>
                            <div
                                className={styles.memoryFill}
                                style={{ width: `${memoryPercent}%` }}
                            />
                        </div>
                        <span className={styles.metricValue}>{metrics.memory.used}MB</span>
                    </div>

                    {/* Latency */}
                    <div className={styles.metric}>
                        <Wifi size={12} className={`${styles.metricIcon} ${styles[getLatencyStatus(metrics.latency)]}`} />
                        <span className={styles.metricLabel}>PING</span>
                        <span className={`${styles.metricValue} ${styles[getLatencyStatus(metrics.latency)]}`}>
                            {metrics.latency}ms
                        </span>
                    </div>

                    {/* FPS */}
                    <div className={styles.metric}>
                        <Cpu size={12} className={styles.metricIcon} />
                        <span className={styles.metricLabel}>FPS</span>
                        <span className={styles.metricValue}>{metrics.fps}</span>
                    </div>

                    {/* Connections */}
                    <div className={styles.metric}>
                        <Database size={12} className={styles.metricIcon} />
                        <span className={styles.metricLabel}>CONN</span>
                        <span className={styles.metricValue}>{metrics.connections}</span>
                    </div>

                    {/* Uptime */}
                    <div className={styles.metric}>
                        <Clock size={12} className={styles.metricIcon} />
                        <span className={styles.metricLabel}>UP</span>
                        <span className={styles.metricValue}>{formatUptime(metrics.uptime)}</span>
                    </div>
                </div>

                {/* Right Section - Activity Indicator */}
                <div className={styles.rightSection}>
                    <div className={styles.activityIndicator}>
                        <Activity size={12} />
                        <span className={styles.activityText}>SYSTEM ACTIVE</span>
                        <span className={styles.activityDot} />
                    </div>
                    <RefreshCw size={10} className={styles.syncIcon} />
                </div>
            </div>
        </footer>
    );
};

export default SystemStatus;
