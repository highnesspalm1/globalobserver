import React, { useState, useEffect } from 'react';
import { Bookmark, MapPin, Star, Trash2, Plus, X, Navigation } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { IconButton } from '../ui/Button';
import styles from './Bookmarks.module.css';

interface BookmarkItem {
  id: string;
  name: string;
  type: 'location' | 'event';
  coordinates: [number, number];
  zoom?: number;
  eventId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'globalobserver-bookmarks';

function loadBookmarks(): BookmarkItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: BookmarkItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export const Bookmarks: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(loadBookmarks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  
  const viewState = useMapStore((state) => state.viewState);
  const setViewState = useMapStore((state) => state.setViewState);
  const selectedEventId = useMapStore((state) => state.selectedEventId);
  const events = useMapStore((state) => state.events);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  const addCurrentLocation = () => {
    if (!newBookmarkName.trim()) return;

    const newBookmark: BookmarkItem = {
      id: `bm-${Date.now()}`,
      name: newBookmarkName.trim(),
      type: 'location',
      coordinates: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      createdAt: new Date().toISOString(),
    };

    setBookmarks([...bookmarks, newBookmark]);
    setNewBookmarkName('');
    setShowAddForm(false);
  };

  const addCurrentEvent = () => {
    if (!selectedEventId) return;
    
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    // Check if already bookmarked
    if (bookmarks.some(b => b.eventId === selectedEventId)) return;

    const newBookmark: BookmarkItem = {
      id: `bm-${Date.now()}`,
      name: event.title.substring(0, 50),
      type: 'event',
      coordinates: event.coordinates as [number, number],
      eventId: selectedEventId,
      zoom: 8,
      createdAt: new Date().toISOString(),
    };

    setBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  const goToBookmark = (bookmark: BookmarkItem) => {
    setViewState({
      longitude: bookmark.coordinates[0],
      latitude: bookmark.coordinates[1],
      zoom: bookmark.zoom || 6,
    });
    
    if (bookmark.eventId) {
      useMapStore.getState().setSelectedEventId(bookmark.eventId);
    }
  };

  if (!isOpen) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(true)}
        title="Lesezeichen"
      >
        <Bookmark size={18} />
        {bookmarks.length > 0 && (
          <span className={styles.badge}>{bookmarks.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bookmark size={16} />
          <span>LESEZEICHEN</span>
        </div>
        <IconButton
          icon={<X size={16} />}
          onClick={() => setIsOpen(false)}
          size="sm"
          aria-label="Schließen"
        />
      </div>

      <div className={styles.actions}>
        {showAddForm ? (
          <div className={styles.addForm}>
            <input
              type="text"
              value={newBookmarkName}
              onChange={(e) => setNewBookmarkName(e.target.value)}
              placeholder="Name für Lesezeichen..."
              className={styles.input}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addCurrentLocation()}
            />
            <div className={styles.addFormButtons}>
              <button 
                className={styles.addButton}
                onClick={addCurrentLocation}
                disabled={!newBookmarkName.trim()}
              >
                <MapPin size={14} />
                Speichern
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddForm(false);
                  setNewBookmarkName('');
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.quickActions}>
            <button 
              className={styles.actionButton}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={14} />
              Aktuelle Position
            </button>
            {selectedEventId && (
              <button 
                className={styles.actionButton}
                onClick={addCurrentEvent}
                disabled={bookmarks.some(b => b.eventId === selectedEventId)}
              >
                <Star size={14} />
                Event merken
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.list}>
        {bookmarks.length === 0 ? (
          <div className={styles.empty}>
            <Bookmark size={32} />
            <p>Keine Lesezeichen</p>
            <span>Speichern Sie Orte oder Events für schnellen Zugriff</span>
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <div key={bookmark.id} className={styles.item}>
              <button
                className={styles.itemContent}
                onClick={() => goToBookmark(bookmark)}
              >
                <div className={styles.itemIcon}>
                  {bookmark.type === 'event' ? (
                    <Star size={16} />
                  ) : (
                    <MapPin size={16} />
                  )}
                </div>
                <div className={styles.itemText}>
                  <span className={styles.itemName}>{bookmark.name}</span>
                  <span className={styles.itemCoords}>
                    {bookmark.coordinates[1].toFixed(2)}°, {bookmark.coordinates[0].toFixed(2)}°
                  </span>
                </div>
                <Navigation size={14} className={styles.navIcon} />
              </button>
              <button
                className={styles.deleteButton}
                onClick={() => removeBookmark(bookmark.id)}
                title="Löschen"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
