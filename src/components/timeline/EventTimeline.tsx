import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Clock, X, Calendar, ChevronDown, ChevronUp, 
  MapPin, Filter, Play, Pause, FastForward
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './EventTimeline.module.css';

interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  category: string;
  severity: string;
  location: string;
  lat: number;
  lng: number;
}

interface GroupedEvents {
  date: string;
  events: TimelineEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#e74c3c',
  high: '#e67e22',
  medium: '#f1c40f',
  low: '#3498db',
  unknown: '#95a5a6',
};

const CATEGORY_ICONS: Record<string, string> = {
  conflict: '⚔️',
  disaster: '🌊',
  earthquake: '🔴',
  weather: '🌪️',
  fire: '🔥',
  political: '🏛️',
  humanitarian: '🚨',
  unknown: '📍',
};

export const EventTimeline: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const events = useMapStore(state => state.events);
  const setSelectedEventId = useMapStore(state => state.setSelectedEventId);

  // Define event type for casting
  type EventData = {
    id?: string;
    title?: string;
    date?: string | number;
    timestamp?: string | number;
    category?: string;
    severity?: string;
    location?: string;
    country?: string;
    lat?: number;
    latitude?: number;
    lng?: number;
    longitude?: number;
  };

  // Convert and sort events
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const fallbackDate = new Date();
    return events
      .map((event, index) => {
        const e = event as EventData;
        return {
          id: e.id || `event-${index}`,
          title: e.title || 'Unbekanntes Ereignis',
          date: new Date(e.date || e.timestamp || fallbackDate),
          category: e.category || 'unknown',
          severity: e.severity || 'unknown',
          location: e.location || e.country || 'Unbekannt',
          lat: e.lat || e.latitude || 0,
          lng: e.lng || e.longitude || 0,
        };
      })
      .filter(e => {
        if (selectedRegion !== 'all' && !e.location.toLowerCase().includes(selectedRegion.toLowerCase())) {
          return false;
        }
        if (selectedCategory !== 'all' && e.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [events, selectedRegion, selectedCategory]);

  // Group events by date
  const groupedEvents = useMemo((): GroupedEvents[] => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    timelineEvents.forEach(event => {
      const dateKey = event.date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return Object.entries(groups).map(([date, evts]) => ({
      date,
      events: evts,
    }));
  }, [timelineEvents]);

  // Get unique regions and categories
  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>();
    events.forEach(event => {
      const e = event as EventData;
      const loc = e.location || e.country;
      if (loc) uniqueRegions.add(loc);
    });
    return Array.from(uniqueRegions).sort();
  }, [events]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    events.forEach(event => {
      const e = event as EventData;
      const cat = e.category;
      if (cat) uniqueCategories.add(cat);
    });
    return Array.from(uniqueCategories).sort();
  }, [events]);

  // Toggle date expansion
  const toggleDate = useCallback((date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

  // Focus on event on map
  const focusEvent = useCallback((event: TimelineEvent) => {
    setSelectedEventId(event.id);
    
    // Trigger map to fly to location
    window.dispatchEvent(new CustomEvent('flyToLocation', {
      detail: { lat: event.lat, lng: event.lng, zoom: 8 }
    }));

    // On mobile, close the timeline
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [setSelectedEventId]);

  // Playback functionality
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    playIntervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= timelineEvents.length) {
          setIsPlaying(false);
          return 0;
        }
        
        // Focus current event
        const event = timelineEvents[next];
        if (event) {
          focusEvent(event);
        }
        
        return next;
      });
    }, 2000 / playSpeed);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, timelineEvents, focusEvent]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Event-Timeline"
      >
        <Clock size={18} />
      </button>

      {/* Timeline Panel */}
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>
              <Clock size={18} />
              Event-Timeline
            </h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <Filter size={14} />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">Alle Regionen</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Alle Kategorien</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Playback Controls */}
          <div className={styles.playbackControls}>
            <button
              className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Abspielen'}
            </button>

            <div className={styles.speedControl}>
              <FastForward size={14} />
              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            <span className={styles.eventCount}>
              {timelineEvents.length} Events
            </span>
          </div>

          {/* Timeline */}
          <div className={styles.timeline} ref={timelineRef}>
            {groupedEvents.length === 0 ? (
              <div className={styles.empty}>
                <Calendar size={32} />
                <p>Keine Events gefunden</p>
              </div>
            ) : (
              groupedEvents.map((group, groupIndex) => (
                <div key={group.date} className={styles.dateGroup}>
                  <button
                    className={styles.dateHeader}
                    onClick={() => toggleDate(group.date)}
                  >
                    <Calendar size={16} />
                    <span className={styles.dateText}>{group.date}</span>
                    <span className={styles.eventBadge}>{group.events.length}</span>
                    {expandedDates.has(group.date) ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {expandedDates.has(group.date) && (
                    <div className={styles.eventList}>
                      {group.events.map((event, eventIndex) => {
                        const globalIndex = groupedEvents
                          .slice(0, groupIndex)
                          .reduce((sum, g) => sum + g.events.length, 0) + eventIndex;
                        const isCurrent = isPlaying && currentIndex === globalIndex;

                        return (
                          <div
                            key={event.id}
                            className={`${styles.eventItem} ${isCurrent ? styles.current : ''}`}
                            onClick={() => focusEvent(event)}
                          >
                            <div className={styles.eventTimeline}>
                              <div 
                                className={styles.timelineDot}
                                style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
                              />
                              {eventIndex < group.events.length - 1 && (
                                <div className={styles.timelineLine} />
                              )}
                            </div>

                            <div className={styles.eventContent}>
                              <div className={styles.eventHeader}>
                                <span className={styles.eventTime}>
                                  {formatTime(event.date)}
                                </span>
                                <span className={styles.eventCategory}>
                                  {CATEGORY_ICONS[event.category] || '📍'}
                                </span>
                                <span 
                                  className={styles.severityBadge}
                                  style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
                                >
                                  {event.severity}
                                </span>
                              </div>

                              <h4 className={styles.eventTitle}>{event.title}</h4>

                              <div className={styles.eventMeta}>
                                <MapPin size={12} />
                                <span>{event.location}</span>
                                <span className={styles.relativeTime}>
                                  {getRelativeTime(event.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EventTimeline;
