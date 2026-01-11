import React, { useState, useCallback, useEffect } from 'react';
import { 
  GitCompare, X, Calendar, ArrowRight, Play, Pause, 
  ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './CompareMode.module.css';

interface ComparisonStats {
  left: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  right: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

const PRESET_RANGES: { label: string; getDates: () => [Date, Date] }[] = [
  { 
    label: 'Heute vs. Gestern',
    getDates: () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return [yesterday, today];
    }
  },
  { 
    label: 'Diese Woche vs. Letzte Woche',
    getDates: () => {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return [lastWeek, today];
    }
  },
  { 
    label: 'Dieser Monat vs. Letzter Monat',
    getDates: () => {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return [lastMonth, today];
    }
  },
  { 
    label: 'Dieses Jahr vs. Letztes Jahr',
    getDates: () => {
      const today = new Date();
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return [lastYear, today];
    }
  },
];

export const CompareMode: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [leftDate, setLeftDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [rightDate, setRightDate] = useState<Date>(new Date());
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showStats] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const events = useMapStore(state => state.events);

  // Define event type for casting
  type EventData = {
    date?: string | number;
    timestamp?: string | number;
    category?: string;
    severity?: string;
  };

  // Filter events by date
  const getEventsForDate = useCallback((date: Date, dayRange: number = 1): EventData[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + dayRange);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const e = event as EventData;
      const eventDate = new Date(e.date || e.timestamp || 0);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    }) as EventData[];
  }, [events]);

  // Calculate comparison stats
  const calculateStats = useCallback((): ComparisonStats => {
    const leftEvents = getEventsForDate(leftDate, 1);
    const rightEvents = getEventsForDate(rightDate, 1);

    const getStats = (evts: EventData[]) => ({
      total: evts.length,
      byCategory: evts.reduce((acc, e) => {
        const cat = e.category || 'unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: evts.reduce((acc, e) => {
        const sev = e.severity || 'unknown';
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });

    return {
      left: getStats(leftEvents),
      right: getStats(rightEvents),
    };
  }, [leftDate, rightDate, getEventsForDate]);

  const stats = calculateStats();

  // Handle split slider drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('compare-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSplitPosition(Math.max(10, Math.min(90, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Animation for split reveal
  useEffect(() => {
    if (!isAnimating) return;

    let position = 0;
    let direction = 1;
    const interval = setInterval(() => {
      position += direction * 2;
      if (position >= 90) direction = -1;
      if (position <= 10) direction = 1;
      setSplitPosition(position);
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const applyPreset = (preset: typeof PRESET_RANGES[0]) => {
    const [left, right] = preset.getDates();
    setLeftDate(left);
    setRightDate(right);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getChange = (left: number, right: number): { value: number; label: string; type: 'increase' | 'decrease' | 'same' } => {
    if (left === right) return { value: 0, label: '±0', type: 'same' };
    const diff = right - left;
    return {
      value: diff,
      label: diff > 0 ? `+${diff}` : `${diff}`,
      type: diff > 0 ? 'increase' : 'decrease',
    };
  };

  const totalChange = getChange(stats.left.total, stats.right.total);

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isActive ? styles.active : ''}`}
        onClick={() => setIsOpen(true)}
        title="Zeitvergleich"
      >
        <GitCompare size={18} />
      </button>

      {/* Compare Panel */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>
                <GitCompare size={18} />
                Zeitvergleich
              </h3>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Presets */}
            <div className={styles.presets}>
              {PRESET_RANGES.map((preset, i) => (
                <button
                  key={i}
                  className={styles.presetButton}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Date Selection */}
            <div className={styles.dateSelection}>
              <div className={styles.dateInput}>
                <label>Zeitpunkt A</label>
                <div className={styles.dateField}>
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={leftDate.toISOString().split('T')[0]}
                    onChange={(e) => setLeftDate(new Date(e.target.value))}
                  />
                </div>
              </div>

              <ArrowRight className={styles.dateArrow} size={24} />

              <div className={styles.dateInput}>
                <label>Zeitpunkt B</label>
                <div className={styles.dateField}>
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={rightDate.toISOString().split('T')[0]}
                    onChange={(e) => setRightDate(new Date(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Stats Comparison */}
            {showStats && (
              <div className={styles.statsComparison}>
                <div className={styles.statsSide}>
                  <div className={styles.statsLabel}>{formatDate(leftDate)}</div>
                  <div className={styles.statsValue}>{stats.left.total}</div>
                  <div className={styles.statsSubtext}>Ereignisse</div>
                </div>

                <div className={styles.statsChange}>
                  <div className={`${styles.changeValue} ${styles[totalChange.type]}`}>
                    {totalChange.label}
                  </div>
                  <div className={styles.changeLabel}>
                    {totalChange.type === 'increase' ? 'Mehr' : totalChange.type === 'decrease' ? 'Weniger' : 'Gleich'}
                  </div>
                </div>

                <div className={styles.statsSide}>
                  <div className={styles.statsLabel}>{formatDate(rightDate)}</div>
                  <div className={styles.statsValue}>{stats.right.total}</div>
                  <div className={styles.statsSubtext}>Ereignisse</div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            <div className={styles.categoryBreakdown}>
              <h4>Nach Kategorie</h4>
              <div className={styles.categoryList}>
                {Object.keys({ ...stats.left.byCategory, ...stats.right.byCategory }).map(cat => {
                  const left = stats.left.byCategory[cat] || 0;
                  const right = stats.right.byCategory[cat] || 0;
                  const change = getChange(left, right);
                  return (
                    <div key={cat} className={styles.categoryItem}>
                      <span className={styles.categoryName}>{cat}</span>
                      <span className={styles.categoryValues}>
                        {left} → {right}
                        <span className={`${styles.categoryChange} ${styles[change.type]}`}>
                          ({change.label})
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              <button
                className={`${styles.controlButton} ${isActive ? styles.active : ''}`}
                onClick={() => {
                  setIsActive(!isActive);
                  setIsOpen(false);
                }}
              >
                <Layers size={16} />
                {isActive ? 'Vergleich beenden' : 'Split-Ansicht aktivieren'}
              </button>

              <button
                className={`${styles.controlButton} ${isAnimating ? styles.active : ''}`}
                onClick={() => setIsAnimating(!isAnimating)}
                disabled={!isActive}
              >
                {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                {isAnimating ? 'Stopp' : 'Animation'}
              </button>
            </div>

            <p className={styles.hint}>
              Im Split-Modus zeigt die linke Seite Ereignisse vom ersten Datum,
              die rechte Seite vom zweiten Datum.
            </p>
          </div>
        </div>
      )}

      {/* Split View Overlay (when active) */}
      {isActive && (
        <div 
          id="compare-container"
          className={styles.splitOverlay}
        >
          <div 
            className={styles.splitDivider}
            style={{ left: `${splitPosition}%` }}
            onMouseDown={handleMouseDown}
          >
            <div className={styles.dividerHandle}>
              <ChevronLeft size={14} />
              <ChevronRight size={14} />
            </div>
          </div>

          <div className={styles.splitLabels}>
            <div className={styles.splitLabel} style={{ left: `${splitPosition / 2}%` }}>
              {formatDate(leftDate)}
              <span>{stats.left.total} Events</span>
            </div>
            <div className={styles.splitLabel} style={{ right: `${(100 - splitPosition) / 2}%` }}>
              {formatDate(rightDate)}
              <span>{stats.right.total} Events</span>
            </div>
          </div>

          <button
            className={styles.exitSplit}
            onClick={() => setIsActive(false)}
          >
            <X size={14} />
            Vergleich beenden
          </button>
        </div>
      )}
    </>
  );
};

export default CompareMode;
