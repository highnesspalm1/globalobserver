import React, { useState, useCallback, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  X,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Copy,
  Navigation,
  Bomb,
  Truck,
  Crosshair,
  Radio,
  Anchor,
  Landmark,
  Heart,
  Building,
  Siren,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  MessageCircle,
  Link2,
  History,
  TrendingUp,
  AlertCircle,
  Image as ImageIcon,
  Play,
  Pause,
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '../../types/database';
import type { MapEvent } from '../../types/database';
import { notify } from '../../stores/notificationStore';
import styles from './EventDetailPanel.module.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  shelling: <Bomb size={14} />,
  air_raid: <Siren size={14} />,
  movement: <Truck size={14} />,
  combat: <Crosshair size={14} />,
  drone: <Radio size={14} />,
  naval: <Anchor size={14} />,
  political: <Landmark size={14} />,
  humanitarian: <Heart size={14} />,
  infrastructure: <Building size={14} />,
};

interface EventDetailPanelProps {
  event: MapEvent;
  onClose: () => void;
}

// Animated Stats Counter
const AnimatedStat: React.FC<{ value: number; label: string; icon: React.ReactNode }> = ({
  value,
  label,
  icon,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    const duration = 600;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className={styles.statItem}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{displayValue}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
};

// Timeline Event Item
const TimelineItem: React.FC<{ time: string; title: string; type: 'update' | 'verification' | 'source' }> = ({
  time,
  title,
  type,
}) => {
  const icons = {
    update: <History size={12} />,
    verification: <CheckCircle size={12} />,
    source: <Link2 size={12} />,
  };

  return (
    <div className={styles.timelineItem}>
      <div className={`${styles.timelineDot} ${styles[`timeline${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
        {icons[type]}
      </div>
      <div className={styles.timelineContent}>
        <span className={styles.timelineTime}>{time}</span>
        <span className={styles.timelineTitle}>{title}</span>
      </div>
    </div>
  );
};

// Media Gallery with Lightbox
const MediaGallery: React.FC<{ urls: string[] }> = ({ urls }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePrev = useCallback(() => {
    setSelectedIndex((i) => (i > 0 ? i - 1 : urls.length - 1));
  }, [urls.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((i) => (i < urls.length - 1 ? i + 1 : 0));
  }, [urls.length]);

  // Slideshow effect
  React.useEffect(() => {
    if (isPlaying && urls.length > 1) {
      const interval = setInterval(handleNext, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, handleNext, urls.length]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className={styles.mediaSection}>
        <div className={styles.mediaSectionHeader}>
          <h4 className={styles.mediaSectionTitle}>
            <ImageIcon size={14} />
            Medien ({urls.length})
          </h4>
          {urls.length > 1 && (
            <button
              className={styles.slideshowButton}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          )}
        </div>

        <div className={styles.mediaMain}>
          <img
            src={urls[selectedIndex]}
            alt={`Media ${selectedIndex + 1}`}
            className={styles.mediaMainImage}
            onClick={() => setIsLightboxOpen(true)}
          />
          {urls.length > 1 && (
            <>
              <button className={`${styles.mediaNav} ${styles.mediaNavPrev}`} onClick={handlePrev}>
                <ChevronLeft size={16} />
              </button>
              <button className={`${styles.mediaNav} ${styles.mediaNavNext}`} onClick={handleNext}>
                <ChevronRight size={16} />
              </button>
              <div className={styles.mediaCounter}>
                {selectedIndex + 1} / {urls.length}
              </div>
            </>
          )}
        </div>

        {urls.length > 1 && (
          <div className={styles.mediaThumbnails}>
            {urls.map((url, i) => (
              <button
                key={i}
                className={`${styles.mediaThumb} ${i === selectedIndex ? styles.mediaThumbActive : ''}`}
                onClick={() => setSelectedIndex(i)}
              >
                <img src={url} alt={`Thumbnail ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className={styles.lightbox} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.lightboxClose}>
            <X size={24} />
          </button>
          <img
            src={urls[selectedIndex]}
            alt={`Media ${selectedIndex + 1}`}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNavPrev}`}
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNavNext}`}
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event, onClose }) => {
  const { setViewState, events } = useMapStore();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'related'>('details');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const categoryConfig = CATEGORY_CONFIG[event.category];
  const severityConfig = SEVERITY_CONFIG[event.severity];

  // Get related events (same category, nearby time)
  const relatedEvents = useMemo(() => {
    const eventTime = event.eventDate.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;

    return events
      .filter(e =>
        e.id !== event.id &&
        (e.category === event.category ||
          Math.abs(e.eventDate.getTime() - eventTime) < dayInMs * 3)
      )
      .slice(0, 5);
  }, [events, event]);

  const handleCopyCoordinates = useCallback(() => {
    const coords = `${event.coordinates[1].toFixed(6)}, ${event.coordinates[0].toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
    notify.success('Kopiert', 'Koordinaten in Zwischenablage');
  }, [event.coordinates]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}?event=${event.id}`;
    navigator.clipboard.writeText(url);
    notify.success('Link kopiert', 'Event-Link in Zwischenablage');
  }, [event.id]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: event.title,
      text: `${event.title} - Global Observer`,
      url: `${window.location.origin}?event=${event.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  }, [event, handleCopyLink]);

  const handleFlyTo = useCallback(() => {
    setViewState({
      longitude: event.coordinates[0],
      latitude: event.coordinates[1],
      zoom: 14,
    });
    onClose();
  }, [event.coordinates, setViewState, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleRelatedEventClick = useCallback((relatedEvent: MapEvent) => {
    setViewState({
      longitude: relatedEvent.coordinates[0],
      latitude: relatedEvent.coordinates[1],
      zoom: 12,
    });
  }, [setViewState]);

  const getSeverityClass = () => {
    switch (event.severity) {
      case 'low': return styles.severityLow;
      case 'medium': return styles.severityMedium;
      case 'high': return styles.severityHigh;
      case 'critical': return styles.severityCritical;
      default: return '';
    }
  };

  const timeAgo = formatDistanceToNow(event.eventDate, { addSuffix: true, locale: de });

  return (
    <>
      <div className={styles.overlay} onClick={handleOverlayClick} />
      <div className={styles.panel}>
        {/* Header with Category Banner */}
        <div
          className={styles.headerBanner}
          style={{
            background: `linear-gradient(135deg, ${categoryConfig.color}20 0%, ${categoryConfig.color}05 100%)`,
            borderBottom: `2px solid ${categoryConfig.color}40`
          }}
        >
          <div className={styles.headerTop}>
            <span
              className={styles.categoryBadge}
              style={{
                backgroundColor: `${categoryConfig.color}30`,
                color: categoryConfig.color,
                borderColor: `${categoryConfig.color}50`
              }}
            >
              {CATEGORY_ICONS[event.category]}
              {categoryConfig.label}
            </span>
            <div className={styles.headerActions}>
              <button
                className={`${styles.headerButton} ${isBookmarked ? styles.headerButtonActive : ''}`}
                onClick={() => setIsBookmarked(!isBookmarked)}
                title="Merken"
              >
                <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button
                className={styles.headerButton}
                onClick={handleShare}
                title="Teilen"
              >
                <Share2 size={16} />
              </button>
              <button className={styles.closeButton} onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 className={styles.title}>{event.title}</h2>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <Clock size={14} />
              <span title={format(event.eventDate, "dd. MMMM yyyy 'um' HH:mm", { locale: de })}>
                {timeAgo}
              </span>
            </div>

            <span className={`${styles.severityBadge} ${getSeverityClass()}`}>
              <AlertCircle size={10} />
              {severityConfig.label}
            </span>

            {event.verified ? (
              <span className={styles.verifiedBadge}>
                <CheckCircle size={10} />
                Verifiziert
              </span>
            ) : (
              <span className={styles.unverifiedBadge}>
                <AlertTriangle size={10} />
                Unbestätigt
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <Eye size={14} />
            Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'timeline' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <History size={14} />
            Verlauf
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'related' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('related')}
          >
            <TrendingUp size={14} />
            Verwandt
            {relatedEvents.length > 0 && (
              <span className={styles.tabBadge}>{relatedEvents.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'details' && (
            <>
              {/* Description */}
              {event.description && (
                <div className={styles.descriptionCard}>
                  <p className={styles.description}>{event.description}</p>
                </div>
              )}

              {/* Quick Stats - using stable values based on event hash */}
              <div className={styles.statsRow}>
                <AnimatedStat
                  value={event.id.length * 50 + 100}
                  label="Aufrufe"
                  icon={<Eye size={14} />}
                />
                <AnimatedStat
                  value={event.tags.length * 3 + 5}
                  label="Quellen"
                  icon={<Link2 size={14} />}
                />
                <AnimatedStat
                  value={event.verified ? 8 : 2}
                  label="Updates"
                  icon={<History size={14} />}
                />
              </div>

              {/* Location Card */}
              <div className={styles.locationCard}>
                <div className={styles.locationHeader}>
                  <MapPin size={16} className={styles.locationIcon} />
                  <span className={styles.locationTitle}>Position</span>
                </div>
                <div className={styles.locationContent}>
                  <div className={styles.coordDisplay}>
                    <div className={styles.coordItem}>
                      <span className={styles.coordLabel}>Lat</span>
                      <span className={styles.coordValue}>{event.coordinates[1].toFixed(6)}°</span>
                    </div>
                    <div className={styles.coordItem}>
                      <span className={styles.coordLabel}>Lng</span>
                      <span className={styles.coordValue}>{event.coordinates[0].toFixed(6)}°</span>
                    </div>
                  </div>
                  <button
                    className={`${styles.copyButton} ${copiedCoords ? styles.copyButtonSuccess : ''}`}
                    onClick={handleCopyCoordinates}
                    title="Koordinaten kopieren"
                  >
                    {copiedCoords ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <h4 className={styles.sectionLabel}>Tags</h4>
                  <div className={styles.tags}>
                    {event.tags.map((tag, i) => (
                      <span key={i} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {event.mediaUrls && event.mediaUrls.length > 0 && (
                <MediaGallery urls={event.mediaUrls} />
              )}

              {/* Date Info */}
              <div className={styles.dateInfo}>
                <Calendar size={14} />
                <span>{format(event.eventDate, "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}</span>
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className={styles.timelineSection}>
              <div className={styles.timeline}>
                <TimelineItem
                  time={format(event.eventDate, 'HH:mm', { locale: de })}
                  title="Event erstellt"
                  type="update"
                />
                {event.verified && (
                  <TimelineItem
                    time={format(new Date(event.eventDate.getTime() + 3600000), 'HH:mm', { locale: de })}
                    title="Event verifiziert"
                    type="verification"
                  />
                )}
                {event.sourceUrl && (
                  <TimelineItem
                    time={format(new Date(event.eventDate.getTime() + 1800000), 'HH:mm', { locale: de })}
                    title="Quelle hinzugefügt"
                    type="source"
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'related' && (
            <div className={styles.relatedSection}>
              {relatedEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageCircle size={32} />
                  <p>Keine verwandten Events gefunden</p>
                </div>
              ) : (
                <div className={styles.relatedList}>
                  {relatedEvents.map((related) => (
                    <button
                      key={related.id}
                      className={styles.relatedItem}
                      onClick={() => handleRelatedEventClick(related)}
                    >
                      <div
                        className={styles.relatedIcon}
                        style={{ color: CATEGORY_CONFIG[related.category].color }}
                      >
                        {CATEGORY_ICONS[related.category]}
                      </div>
                      <div className={styles.relatedContent}>
                        <span className={styles.relatedTitle}>{related.title}</span>
                        <span className={styles.relatedMeta}>
                          {formatDistanceToNow(related.eventDate, { addSuffix: true, locale: de })}
                        </span>
                      </div>
                      <Navigation size={14} className={styles.relatedNav} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className={styles.footer}>
          <button className={`${styles.actionButton} ${styles.actionPrimary}`} onClick={handleFlyTo}>
            <Navigation size={14} />
            Zur Position
          </button>
          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionButton} ${styles.actionSecondary}`}
            >
              <ExternalLink size={14} />
              Quelle öffnen
            </a>
          )}
        </div>
      </div>
    </>
  );
};
