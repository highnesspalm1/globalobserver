import React, { useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  X,
  MapPin,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Notification, NotificationType } from '../../stores/notificationStore';
import { useMapStore } from '../../stores/mapStore';
import styles from './NotificationCenter.module.css';

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  event: <Bell size={18} />,
};

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { t } = useI18n();
  const setViewState = useMapStore((state) => state.setViewState);

  const handleFlyTo = useCallback(() => {
    if (notification.coordinates) {
      setViewState({
        longitude: notification.coordinates[0],
        latitude: notification.coordinates[1],
        zoom: 12,
      });
    }
    onClose();
  }, [notification.coordinates, setViewState, onClose]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.notification} ${styles[notification.type]}`}>
      <div className={styles.iconContainer}>
        {ICONS[notification.type]}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.title}>{notification.title}</span>
          <span className={styles.time}>{formatTime(notification.timestamp)}</span>
        </div>
        
        {notification.message && (
          <p className={styles.message}>{notification.message}</p>
        )}
        
        {notification.coordinates && (
          <button className={styles.flyToButton} onClick={handleFlyTo}>
            <MapPin size={12} />
            <span>{t.app.goToLocation}</span>
          </button>
        )}
      </div>
      
      <button className={styles.closeButton} onClick={onClose} aria-label={t.app.close}>
        <X size={14} />
      </button>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const { t } = useI18n();
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const clearAll = useNotificationStore((state) => state.clearAll);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {notifications.length > 2 && (
        <button className={styles.clearAllButton} onClick={clearAll}>
          {t.notifications.clearAll} ({notifications.length})
        </button>
      )}
      
      <div className={styles.list}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};
