import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  ExternalLink, 
  Clock, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '../../types/database';
import { useI18n } from '../../i18n';
import styles from './EventPopup.module.css';

interface EventPopupProps {
  event: {
    id: string;
    title: string;
    description?: string;
    category: string;
    severity: string;
    eventDate: string;
    verified: boolean;
    sourceUrl?: string;
  };
  coordinates: [number, number];
  onClose: () => void;
  map: maplibregl.Map | null;
}

export const EventPopup: React.FC<EventPopupProps> = ({
  event,
  coordinates,
  onClose,
  map,
}) => {
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const categoryConfig = CATEGORY_CONFIG[event.category as keyof typeof CATEGORY_CONFIG];
  const severityConfig = SEVERITY_CONFIG[event.severity as keyof typeof SEVERITY_CONFIG];

  useEffect(() => {
    if (!map || !containerRef.current) return;

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '320px',
      offset: 15,
    })
      .setLngLat(coordinates)
      .setDOMContent(containerRef.current)
      .addTo(map);

    return () => {
      popupRef.current?.remove();
    };
  }, [map, coordinates]);

  const eventDate = new Date(event.eventDate);

  return (
    <div ref={containerRef} className={styles.popup}>
      {/* Header */}
      <div className={styles.header}>
        <div 
          className={styles.categoryBadge}
          style={{ backgroundColor: categoryConfig?.color || '#666' }}
        >
          {categoryConfig?.label || event.category}
        </div>
        <div 
          className={styles.severityBadge}
          style={{ 
            backgroundColor: severityConfig?.color || '#666',
            opacity: 0.9 
          }}
        >
          <AlertTriangle size={10} />
          {severityConfig?.label || event.severity}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <XCircle size={18} />
        </button>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{event.title}</h3>

      {/* Description */}
      {event.description && (
        <p className={styles.description}>{event.description}</p>
      )}

      {/* Meta Info */}
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <Clock size={14} />
          <span>{format(eventDate, 'dd. MMM yyyy, HH:mm', { locale: de })}</span>
        </div>
        <div className={styles.metaItem}>
          <MapPin size={14} />
          <span>
            {coordinates[1].toFixed(4)}°, {coordinates[0].toFixed(4)}°
          </span>
        </div>
      </div>

      {/* Verification Status */}
      <div className={styles.verification}>
        {event.verified ? (
          <>
            <CheckCircle size={14} className={styles.verifiedIcon} />
            <span className={styles.verifiedText}>{t.events.verified}</span>
          </>
        ) : (
          <>
            <AlertTriangle size={14} className={styles.unverifiedIcon} />
            <span className={styles.unverifiedText}>{t.events.unverified}</span>
          </>
        )}
      </div>

      {/* Source Link */}
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          <ExternalLink size={14} />
          {t.app.viewSource}
        </a>
      )}
    </div>
  );
};
