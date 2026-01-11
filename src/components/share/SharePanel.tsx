import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Share2, Link2, Copy, Check, Twitter, Mail, MapPin, X, QrCode } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './SharePanel.module.css';

interface ShareConfig {
  type: 'view' | 'event';
  eventId?: string;
  eventTitle?: string;
}

// Map state stored in URL params

export const SharePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareConfig, setShareConfig] = useState<ShareConfig>({ type: 'view' });
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const mapStyle = useMapStore(state => state.mapStyle);
  const selectedEventId = useMapStore(state => state.selectedEventId);
  const events = useMapStore(state => state.events);
  const selectedEvent = events.find((e) => (e as { id?: string }).id === selectedEventId);

  // Listen for toggle event from FloatingMenu
  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      if (e.detail.toolId === 'share') {
        setShareConfig({ type: 'view' });
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('toggleMapTool', handleToggle as EventListener);
    return () => window.removeEventListener('toggleMapTool', handleToggle as EventListener);
  }, []);

  const applySharedState = useCallback((params: URLSearchParams) => {
    const lat = params.get('lat');
    const lng = params.get('lng');
    const zoom = params.get('zoom');
    const style = params.get('style');
    const eventId = params.get('event');

    // Apply map position if provided
    if (lat && lng && zoom) {
      // The map will need to fly to this position
      const customEvent = new CustomEvent('flyToLocation', {
        detail: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          zoom: parseFloat(zoom),
        }
      });
      window.dispatchEvent(customEvent);
    }

    // Apply style if provided
    if (style) {
      const setMapStyle = useMapStore.getState().setMapStyle;
      setMapStyle(style as 'dark' | 'satellite' | 'terrain' | 'tactical');
    }

    // Select event if provided
    if (eventId) {
      // Event selection would be handled by the data service
      const customEvent = new CustomEvent('selectEventById', { detail: { eventId } });
      window.dispatchEvent(customEvent);
    }

    // Clear URL params after applying
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasShareParams = params.has('lat') || params.has('event');

    if (hasShareParams) {
      applySharedState(params);
    }
  }, [applySharedState]);

  const generateShareUrl = useCallback((config: ShareConfig): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    // Get current map state from the map instance
    const mapState = (window as { __mapInstance?: { getCenter: () => { lat: number; lng: number }; getZoom: () => number } }).__mapInstance;
    if (mapState) {
      const center = mapState.getCenter();
      const zoom = mapState.getZoom();
      params.set('lat', center.lat.toFixed(4));
      params.set('lng', center.lng.toFixed(4));
      params.set('zoom', zoom.toFixed(1));
    }

    params.set('style', mapStyle);

    if (config.type === 'event' && config.eventId) {
      params.set('event', config.eventId);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [mapStyle]);

  // Generate share URL - derived state instead of effect
  const shareUrl = useMemo(() => {
    if (!isOpen) return '';
    return generateShareUrl(shareConfig);
  }, [isOpen, generateShareUrl, shareConfig]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const shareVia = useCallback((platform: 'twitter' | 'email' | 'native') => {
    const title = shareConfig.type === 'event' && shareConfig.eventTitle
      ? `${shareConfig.eventTitle} - Global Observer`
      : 'Global Observer - Aktuelle Kartenansicht';
    
    const text = shareConfig.type === 'event'
      ? `Schau dir dieses Ereignis an: ${shareConfig.eventTitle}`
      : 'Schau dir diese Kartenansicht auf Global Observer an!';

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title,
            text,
            url: shareUrl,
          }).catch(() => {});
        }
        break;
    }
  }, [shareUrl, shareConfig]);

  const handleShareEvent = useCallback((eventId: string, eventTitle: string) => {
    setShareConfig({ type: 'event', eventId, eventTitle });
    setIsOpen(true);
  }, []);

  // Listen for share event requests
  useEffect(() => {
    const handleShareRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ eventId: string; eventTitle: string }>;
      if (customEvent.detail) {
        handleShareEvent(customEvent.detail.eventId, customEvent.detail.eventTitle);
      }
    };

    window.addEventListener('shareEvent', handleShareRequest);
    return () => window.removeEventListener('shareEvent', handleShareRequest);
  }, [handleShareEvent]);

  // Generate QR code URL (using a free API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=1a1a1a&color=d4c5a9`;

  return (
    <>
      {/* Panel - no toggle button, controlled by FloatingMenu */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>
                <Share2 size={18} />
                {shareConfig.type === 'event' ? 'Event teilen' : 'Ansicht teilen'}
              </h3>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {shareConfig.type === 'event' && shareConfig.eventTitle && (
              <div className={styles.eventInfo}>
                <MapPin size={16} />
                <span>{shareConfig.eventTitle}</span>
              </div>
            )}

            {/* Type Toggle */}
            <div className={styles.typeToggle}>
              <button
                className={`${styles.toggleButton} ${shareConfig.type === 'view' ? styles.active : ''}`}
                onClick={() => setShareConfig({ type: 'view' })}
              >
                Kartenansicht
              </button>
              {selectedEvent && (
                <button
                  className={`${styles.toggleButton} ${shareConfig.type === 'event' ? styles.active : ''}`}
                  onClick={() => setShareConfig({
                    type: 'event',
                    eventId: (selectedEvent as { id?: string }).id || '',
                    eventTitle: (selectedEvent as { title?: string }).title || '',
                  })}
                >
                  Aktuelles Event
                </button>
              )}
            </div>

            {/* URL Display */}
            <div className={styles.urlSection}>
              <label>Link zum Teilen:</label>
              <div className={styles.urlInput}>
                <Link2 size={16} />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className={styles.shareOptions}>
              <button
                className={styles.shareOption}
                onClick={() => shareVia('twitter')}
              >
                <Twitter size={20} />
                Twitter
              </button>
              <button
                className={styles.shareOption}
                onClick={() => shareVia('email')}
              >
                <Mail size={20} />
                E-Mail
              </button>
              {'share' in navigator && (
                <button
                  className={styles.shareOption}
                  onClick={() => shareVia('native')}
                >
                  <Share2 size={20} />
                  Mehr...
                </button>
              )}
              <button
                className={`${styles.shareOption} ${showQR ? styles.active : ''}`}
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode size={20} />
                QR-Code
              </button>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className={styles.qrSection}>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className={styles.qrCode}
                />
                <p>Scanne den Code mit deinem Smartphone</p>
              </div>
            )}

            {/* Info */}
            <p className={styles.info}>
              Der Link enthält die aktuelle Kartenposition, den Kartenstil und aktive Ebenen.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SharePanel;
