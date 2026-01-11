import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'event';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: Date;
  eventId?: string; // For event notifications to allow navigation
  coordinates?: [number, number];
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (if not 0)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));

// Helper functions for common notifications
export const notify = {
  success: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'success', title, message }),
  
  error: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'error', title, message, duration: 8000 }),
  
  warning: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'warning', title, message }),
  
  info: (title: string, message?: string) =>
    useNotificationStore.getState().addNotification({ type: 'info', title, message }),
  
  event: (title: string, message?: string, eventId?: string, coordinates?: [number, number]) =>
    useNotificationStore.getState().addNotification({ 
      type: 'event', 
      title, 
      message, 
      eventId, 
      coordinates,
      duration: 10000 
    }),
};
