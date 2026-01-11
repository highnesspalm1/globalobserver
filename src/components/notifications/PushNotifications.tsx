import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, AlertTriangle, X, Check } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { notify } from '../../stores/notificationStore';
import { IconButton } from '../ui/Button';
import styles from './PushNotifications.module.css';

interface NotificationSettings {
  enabled: boolean;
  criticalOnly: boolean;
  regions: string[];
  soundEnabled: boolean;
}

const STORAGE_KEY = 'globalobserver-notifications';
const CHECK_INTERVAL = 60000; // Check every minute

const REGIONS = [
  { id: 'ukraine', name: 'Ukraine/Russland', coords: [31.16, 48.38] },
  { id: 'gaza', name: 'Gaza/Israel', coords: [34.44, 31.50] },
  { id: 'syria', name: 'Syrien', coords: [38.99, 34.80] },
  { id: 'yemen', name: 'Jemen', coords: [44.21, 15.37] },
  { id: 'sudan', name: 'Sudan', coords: [32.53, 15.59] },
  { id: 'iran', name: 'Iran', coords: [51.39, 35.69] },
];

function loadSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      enabled: false,
      criticalOnly: true,
      regions: [],
      soundEnabled: true,
    };
  } catch {
    return {
      enabled: false,
      criticalOnly: true,
      regions: [],
      soundEnabled: true,
    };
  }
}

function saveSettings(settings: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Request browser notification permission
async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Send browser notification
function sendBrowserNotification(title: string, body: string, onClick?: () => void) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'globalobserver',
      requireInteraction: true,
    });
    
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  }
}

export const PushNotifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const [lastCheckedEvents, setLastCheckedEvents] = useState<Set<string>>(new Set());
  
  const events = useMapStore((state) => state.events);
  const setViewState = useMapStore((state) => state.setViewState);
  const setSelectedEventId = useMapStore((state) => state.setSelectedEventId);

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Check for new critical events
  const checkForNewEvents = useCallback(() => {
    if (!settings.enabled) return;

    const criticalEvents = events.filter(event => {
      // Already notified
      if (lastCheckedEvents.has(event.id)) return false;
      
      // Severity filter
      if (settings.criticalOnly && event.severity !== 'critical') return false;
      
      // Region filter
      if (settings.regions.length > 0) {
        const inRegion = settings.regions.some(regionId => {
          const region = REGIONS.find(r => r.id === regionId);
          if (!region) return false;
          
          // Simple distance check (within ~500km)
          const dx = event.coordinates[0] - region.coords[0];
          const dy = event.coordinates[1] - region.coords[1];
          return Math.sqrt(dx * dx + dy * dy) < 5;
        });
        
        if (!inRegion) return false;
      }
      
      // Only events from last hour
      const eventAge = Date.now() - event.eventDate.getTime();
      if (eventAge > 3600000) return false;
      
      return true;
    });

    // Send notifications for new events
    criticalEvents.forEach(event => {
      const severityText = event.severity === 'critical' ? '🔴 KRITISCH' : '🟠 HOCH';
      
      sendBrowserNotification(
        `${severityText}: ${event.category.toUpperCase()}`,
        event.title,
        () => {
          setViewState({
            longitude: event.coordinates[0],
            latitude: event.coordinates[1],
            zoom: 8,
          });
          setSelectedEventId(event.id);
        }
      );

      // Also show in-app notification
      notify.warning(
        `Neues Event: ${event.category}`,
        event.title
      );
    });

    // Update checked events
    if (criticalEvents.length > 0) {
      setLastCheckedEvents(prev => {
        const next = new Set(prev);
        criticalEvents.forEach(e => next.add(e.id));
        return next;
      });
    }
  }, [settings, events, lastCheckedEvents, setViewState, setSelectedEventId]);

  // Periodic check
  useEffect(() => {
    if (!settings.enabled) return;
    
    const interval = setInterval(checkForNewEvents, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [settings.enabled, checkForNewEvents]);

  // Check immediately when events change (debounced to avoid rapid calls)
  useEffect(() => {
    if (!settings.enabled) return;
    const timeoutId = setTimeout(checkForNewEvents, 100);
    return () => clearTimeout(timeoutId);
  }, [events, checkForNewEvents, settings.enabled]);

  const toggleEnabled = async () => {
    if (!settings.enabled) {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        notify.error('Benachrichtigungen blockiert', 'Bitte erlauben Sie Benachrichtigungen in Ihren Browser-Einstellungen');
        return;
      }
    }
    
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const toggleRegion = (regionId: string) => {
    setSettings(prev => ({
      ...prev,
      regions: prev.regions.includes(regionId)
        ? prev.regions.filter(r => r !== regionId)
        : [...prev.regions, regionId],
    }));
  };

  if (!isOpen) {
    return (
      <button
        className={`${styles.toggleButton} ${settings.enabled ? styles.active : ''}`}
        onClick={() => setIsOpen(true)}
        title="Benachrichtigungen"
      >
        {settings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
        {settings.enabled && <span className={styles.activeDot} />}
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bell size={16} />
          <span>BENACHRICHTIGUNGEN</span>
        </div>
        <IconButton
          icon={<X size={16} />}
          onClick={() => setIsOpen(false)}
          size="sm"
          aria-label="Schließen"
        />
      </div>

      <div className={styles.content}>
        {/* Main Toggle */}
        <div className={styles.mainToggle}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Push-Benachrichtigungen</span>
            <span className={styles.toggleDesc}>
              Erhalten Sie Alarme für kritische Events
            </span>
          </div>
          <button
            className={`${styles.switch} ${settings.enabled ? styles.switchOn : ''}`}
            onClick={toggleEnabled}
          >
            <span className={styles.switchThumb} />
          </button>
        </div>

        {settings.enabled && (
          <>
            {/* Critical Only Toggle */}
            <div className={styles.option}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.criticalOnly}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    criticalOnly: e.target.checked 
                  }))}
                />
                <span className={styles.checkmark}>
                  {settings.criticalOnly && <Check size={12} />}
                </span>
                <span>Nur kritische Events</span>
              </label>
            </div>

            {/* Region Selection */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <AlertTriangle size={14} />
                <span>Regionen überwachen</span>
              </div>
              <div className={styles.regionList}>
                {REGIONS.map(region => (
                  <button
                    key={region.id}
                    className={`${styles.regionButton} ${
                      settings.regions.includes(region.id) ? styles.regionActive : ''
                    }`}
                    onClick={() => toggleRegion(region.id)}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
              <span className={styles.hint}>
                {settings.regions.length === 0 
                  ? 'Alle Regionen werden überwacht'
                  : `${settings.regions.length} Region(en) ausgewählt`
                }
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PushNotifications;
