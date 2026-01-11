import React, { useMemo, useEffect, useState, useRef } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  MapPin,
  Shield,
  Zap,
  Eye
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './StatsBar.module.css';

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const difference = value - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + difference * easeOut);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={styles.animatedValue}>{displayValue}</span>;
};

// Mini Sparkline Component
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = 'var(--camo-accent)', 
  height = 20, 
  width = 50 
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create fill path
  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className={styles.sparkline}>
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill="url(#sparklineGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={color}
      />
    </svg>
  );
};

// Status Pulse Component
const StatusPulse: React.FC<{ active?: boolean; color?: string }> = ({ 
  active = true, 
  color = 'var(--success-green)' 
}) => (
  <span 
    className={`${styles.statusPulse} ${active ? styles.statusPulseActive : ''}`}
    style={{ '--pulse-color': color } as React.CSSProperties}
  />
);

export const StatsBar: React.FC = () => {
  const events = useMapStore((state) => state.events);
  const filters = useMapStore((state) => state.filters);
  const selectedDate = useMapStore((state) => state.selectedDate);

  // Generate sparkline data from events
  const sparklineData = useMemo(() => {
    const now = selectedDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = 7;
    
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * dayMs);
      const dayEnd = dayStart + dayMs;
      const count = events.filter(e => {
        const time = e.eventDate.getTime();
        return time >= dayStart && time < dayEnd;
      }).length;
      data.push(count);
    }
    return data;
  }, [events, selectedDate]);

  // Memoize filtered events and stats
  const { filteredCount, stats, criticalCount } = useMemo(() => {
    const selectedTime = selectedDate.getTime();
    
    const filtered = events.filter((event) => {
      const eventTime = event.eventDate.getTime();
      if (eventTime > selectedTime) return false;
      
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      
      if (filters.severities.length > 0 && !filters.severities.includes(event.severity)) {
        return false;
      }
      
      if (filters.verifiedOnly && !event.verified) {
        return false;
      }
      
      return true;
    });

    const bySeverity: Record<string, number> = {};
    filtered.forEach((event) => {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    });

    return {
      filteredCount: filtered.length,
      criticalCount: bySeverity['critical'] || 0,
      stats: {
        total: filtered.length,
        bySeverity,
        verified: filtered.filter((e) => e.verified).length,
      },
    };
  }, [events, selectedDate, filters.categories, filters.severities, filters.verifiedOnly]);

  return (
    <div className={styles.statsBar}>
      {/* Live Status Indicator */}
      <div className={styles.liveIndicator}>
        <StatusPulse active={true} color="var(--success-green)" />
        <span className={styles.liveText}>LIVE</span>
      </div>

      <div className={styles.divider} />

      {/* Visible Events with Sparkline */}
      <div className={styles.statItem}>
        <div className={styles.statIcon}>
          <Eye size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={filteredCount} />
          <span className={styles.statLabel}>Sichtbar</span>
        </div>
        <Sparkline data={sparklineData} color="var(--camo-accent)" />
      </div>

      <div className={styles.divider} />

      {/* Critical Events */}
      <div className={`${styles.statItem} ${criticalCount > 0 ? styles.statItemAlert : ''}`}>
        <div className={styles.statIcon} data-severity="critical">
          <AlertTriangle size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={criticalCount} />
          <span className={styles.statLabel}>Kritisch</span>
        </div>
      </div>

      {/* High Severity */}
      <div className={styles.statItem}>
        <div className={styles.statIcon} data-severity="high">
          <Zap size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={stats.bySeverity['high'] || 0} />
          <span className={styles.statLabel}>Hoch</span>
        </div>
      </div>

      {/* Medium Severity */}
      <div className={styles.statItem}>
        <div className={styles.statIcon} data-severity="medium">
          <Shield size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={stats.bySeverity['medium'] || 0} />
          <span className={styles.statLabel}>Mittel</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Total Events */}
      <div className={styles.statItem}>
        <div className={styles.statIcon}>
          <MapPin size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={stats.total} />
          <span className={styles.statLabel}>Gesamt</span>
        </div>
      </div>

      {/* Verified */}
      <div className={styles.statItem}>
        <div className={styles.statIcon} data-verified>
          <TrendingUp size={16} />
        </div>
        <div className={styles.statContent}>
          <AnimatedCounter value={stats.verified} />
          <span className={styles.statLabel}>Verifiziert</span>
        </div>
      </div>
    </div>
  );
};
