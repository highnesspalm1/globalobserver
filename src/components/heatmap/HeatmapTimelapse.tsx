import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Flame, X, Play, Pause, SkipBack, SkipForward, 
  Calendar, Rewind, FastForward
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './HeatmapTimelapse.module.css';

interface TimelapseConfig {
  startDate: Date;
  endDate: Date;
  intervalMs: number;
  stepDays: number;
}

const DEFAULT_CONFIG: TimelapseConfig = {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: new Date(),
  intervalMs: 500,
  stepDays: 1,
};

export const HeatmapTimelapse: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(DEFAULT_CONFIG.startDate);
  const [config, setConfig] = useState<TimelapseConfig>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);

  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const events = useMapStore(state => state.events);

  // Listen for toggle event from FloatingMenu
  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      if (e.detail.toolId === 'heatmap') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('toggleMapTool', handleToggle as EventListener);
    return () => window.removeEventListener('toggleMapTool', handleToggle as EventListener);
  }, []);

  // Define event type for casting
  type EventData = {
    date?: string | number;
    timestamp?: string | number;
  };

  // Get events count for current date
  const getEventsForDate = useCallback((date: Date): number => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const e = event as EventData;
      const eventDate = new Date(e.date || e.timestamp || 0);
      return eventDate >= dayStart && eventDate <= dayEnd;
    }).length;
  }, [events]);

  // Calculate events for histogram
  const histogram = useCallback((): number[] => {
    const data: number[] = [];
    const currentDateTemp = new Date(config.startDate);
    
    while (currentDateTemp <= config.endDate) {
      data.push(getEventsForDate(currentDateTemp));
      currentDateTemp.setDate(currentDateTemp.getDate() + 1);
    }
    
    return data;
  }, [config.startDate, config.endDate, getEventsForDate]);

  const histogramData = histogram();
  const maxEvents = Math.max(...histogramData, 1);

  // Calculate progress based on current date
  const progress = useMemo(() => {
    const elapsed = currentDate.getTime() - config.startDate.getTime();
    const total = config.endDate.getTime() - config.startDate.getTime();
    return (elapsed / total) * 100;
  }, [currentDate, config.startDate, config.endDate]);

  // Playback logic
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = config.intervalMs / speed;
    
    playIntervalRef.current = setInterval(() => {
      setCurrentDate(prev => {
        const nextDate = new Date(prev);
        nextDate.setDate(nextDate.getDate() + config.stepDays);
        
        if (nextDate > config.endDate) {
          setIsPlaying(false);
          return config.startDate; // Loop back to start
        }
        
        return nextDate;
      });
    }, intervalMs);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, config, speed]);

  // Emit heatmap update event
  useEffect(() => {
    if (!isHeatmapActive) return;

    const event = new CustomEvent('updateHeatmapDate', {
      detail: { date: currentDate }
    });
    window.dispatchEvent(event);
  }, [currentDate, isHeatmapActive]);

  // Activate heatmap layer when timelapse starts
  const activateHeatmap = useCallback(() => {
    // Emit event to enable heatmap layer
    window.dispatchEvent(new CustomEvent('enableHeatmap'));
    setIsHeatmapActive(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!isPlaying) {
      activateHeatmap();
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying, activateHeatmap]);

  const reset = useCallback(() => {
    setCurrentDate(config.startDate);
    setIsPlaying(false);
  }, [config.startDate]);

  const skipToEnd = useCallback(() => {
    setCurrentDate(config.endDate);
    setIsPlaying(false);
  }, [config.endDate]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    const newTime = config.startDate.getTime() + 
      percentage * (config.endDate.getTime() - config.startDate.getTime());
    
    setCurrentDate(new Date(newTime));
    activateHeatmap();
  }, [config.startDate, config.endDate, activateHeatmap]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const currentEvents = getEventsForDate(currentDate);

  return (
    <>
      {/* Panel - no toggle button, controlled by FloatingMenu */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>
                <Flame size={18} />
                Heatmap-Zeitraffer
              </h3>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Current Date Display */}
            <div className={styles.currentDisplay}>
              <div className={styles.dateDisplay}>
                <Calendar size={20} />
                <span className={styles.currentDate}>{formatDate(currentDate)}</span>
              </div>
              <div className={styles.eventCount}>
                <span className={styles.countNumber}>{currentEvents}</span>
                <span className={styles.countLabel}>Ereignisse</span>
              </div>
            </div>

            {/* Histogram */}
            <div className={styles.histogramSection}>
              <div className={styles.histogram}>
                {histogramData.map((count, i) => {
                  const height = (count / maxEvents) * 100;
                  const dayIndex = Math.floor(
                    (currentDate.getTime() - config.startDate.getTime()) / (24 * 60 * 60 * 1000)
                  );
                  const isActive = i === dayIndex;
                  
                  return (
                    <div
                      key={i}
                      className={`${styles.histogramBar} ${isActive ? styles.active : ''}`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${count} Ereignisse`}
                    />
                  );
                })}
              </div>
              <div className={styles.histogramLabels}>
                <span>{formatDate(config.startDate)}</span>
                <span>{formatDate(config.endDate)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressSection}>
              <div 
                className={styles.progressBar}
                onClick={handleProgressClick}
              >
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className={styles.progressHandle}
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className={styles.controls}>
              <button className={styles.controlButton} onClick={reset} title="Zurück zum Start">
                <SkipBack size={18} />
              </button>
              
              <button 
                className={styles.controlButton} 
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() - 7);
                  if (newDate >= config.startDate) {
                    setCurrentDate(newDate);
                    activateHeatmap();
                  }
                }}
                title="-7 Tage"
              >
                <Rewind size={16} />
              </button>
              
              <button 
                className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button 
                className={styles.controlButton}
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() + 7);
                  if (newDate <= config.endDate) {
                    setCurrentDate(newDate);
                    activateHeatmap();
                  }
                }}
                title="+7 Tage"
              >
                <FastForward size={16} />
              </button>
              
              <button className={styles.controlButton} onClick={skipToEnd} title="Zum Ende">
                <SkipForward size={18} />
              </button>
            </div>

            {/* Speed Control */}
            <div className={styles.speedSection}>
              <span className={styles.speedLabel}>Geschwindigkeit:</span>
              <div className={styles.speedButtons}>
                {[0.5, 1, 2, 4].map(s => (
                  <button
                    key={s}
                    className={`${styles.speedButton} ${speed === s ? styles.active : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Config Toggle */}
            <button
              className={styles.configToggle}
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? 'Einstellungen ausblenden' : 'Einstellungen anzeigen'}
            </button>

            {/* Config Panel */}
            {showConfig && (
              <div className={styles.configSection}>
                <div className={styles.configRow}>
                  <label>Startdatum:</label>
                  <input
                    type="date"
                    value={config.startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newStart = new Date(e.target.value);
                      setConfig(prev => ({ ...prev, startDate: newStart }));
                      if (currentDate < newStart) {
                        setCurrentDate(newStart);
                      }
                    }}
                  />
                </div>
                
                <div className={styles.configRow}>
                  <label>Enddatum:</label>
                  <input
                    type="date"
                    value={config.endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newEnd = new Date(e.target.value);
                      setConfig(prev => ({ ...prev, endDate: newEnd }));
                      if (currentDate > newEnd) {
                        setCurrentDate(newEnd);
                      }
                    }}
                  />
                </div>

                <div className={styles.configRow}>
                  <label>Schrittweite:</label>
                  <select
                    value={config.stepDays}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      stepDays: parseInt(e.target.value) 
                    }))}
                  >
                    <option value={1}>1 Tag</option>
                    <option value={7}>1 Woche</option>
                    <option value={30}>1 Monat</option>
                  </select>
                </div>
              </div>
            )}

            {/* Info */}
            <div className={styles.info}>
              <p>
                Die Heatmap zeigt die Dichte der Ereignisse für das ausgewählte Datum.
                {isHeatmapActive && <strong> Heatmap aktiv!</strong>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Progress (when playing but panel closed) */}
      {!isOpen && isPlaying && (
        <div className={styles.floatingProgress}>
          <span className={styles.floatingDate}>{formatDate(currentDate)}</span>
          <div className={styles.floatingBar}>
            <div 
              className={styles.floatingFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            className={styles.floatingPause}
            onClick={() => setIsPlaying(false)}
          >
            <Pause size={14} />
          </button>
        </div>
      )}
    </>
  );
};

export default HeatmapTimelapse;
