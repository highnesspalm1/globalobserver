import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  MapPin,
  Clock,
  Tag,
  Link,
  Edit3,
  Crosshair,
  Save,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n } from '../../i18n';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '../../types/database';
import type { EventCategory, SeverityLevel } from '../../types/database';
import { Button, IconButton } from '../ui/Button';
import styles from './AdminPanel.module.css';

interface EventFormData {
  title: string;
  description: string;
  category: EventCategory;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  eventDate: string;
  sourceUrl: string;
  tags: string[];
}

const DEFAULT_FORM_DATA: EventFormData = {
  title: '',
  description: '',
  category: 'shelling',
  severity: 'medium',
  latitude: 48.3794,
  longitude: 31.1656,
  eventDate: new Date().toISOString().slice(0, 16),
  sourceUrl: '',
  tags: [],
};

export const AdminPanel: React.FC = () => {
  const { t } = useI18n();
  const {
    adminMode,
    setAdminMode,
    addEvent,
    events,
    isPickingLocation,
    setIsPickingLocation,
    pickedLocation,
    setPickedLocation,
  } = useMapStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(DEFAULT_FORM_DATA);
  const [tagInput, setTagInput] = useState('');

  // Track previous picked location to avoid re-processing
  const prevPickedLocationRef = useRef<[number, number] | null>(null);

  // Update coordinates when location is picked from map
  useEffect(() => {
    if (pickedLocation && showForm && pickedLocation !== prevPickedLocationRef.current) {
      prevPickedLocationRef.current = pickedLocation;
      // Defer state updates to avoid synchronous setState in effect  
      const timer = setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          longitude: pickedLocation[0],
          latitude: pickedLocation[1],
        }));
        setIsPickingLocation(false);
        setPickedLocation(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pickedLocation, showForm, setIsPickingLocation, setPickedLocation]);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value,
    }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const newEvent = {
      id: `event-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      severity: formData.severity,
      coordinates: [formData.longitude, formData.latitude] as [number, number],
      eventDate: new Date(formData.eventDate),
      sourceUrl: formData.sourceUrl || null,
      verified: false,
      mediaUrls: [],
      tags: formData.tags,
    };

    addEvent(newEvent);
    setFormData(DEFAULT_FORM_DATA);
    setShowForm(false);
  }, [formData, addEvent]);

  const handleCancel = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setShowForm(false);
  }, []);

  if (!adminMode) {
    return (
      <button
        className={styles.adminToggle}
        onClick={() => setAdminMode(true)}
        title="Admin-Modus aktivieren"
      >
        <Edit3 size={16} />
        <span>{t.admin.title}</span>
      </button>
    );
  }

  return (
    <div className={styles.adminPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Edit3 size={16} />
          <span>{t.admin.panel}</span>
        </div>
        <IconButton
          aria-label={t.admin.exitMode}
          icon={<X size={16} />}
          onClick={() => setAdminMode(false)}
          size="sm"
        />
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>{events.length}</span>
          <span className={styles.statLabel}>{t.admin.eventsTab}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNumber}>
            {events.filter((e) => !e.verified).length}
          </span>
          <span className={styles.statLabel}>{t.admin.pendingTab}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
          fullWidth
        >
          Neues Event
        </Button>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h3>{t.events.create}</h3>
              <IconButton
                aria-label="Schließen"
                icon={<X size={18} />}
                onClick={handleCancel}
              />
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Title */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{t.events.titleLabel} *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Kurze Beschreibung des Ereignisses"
                  className={styles.input}
                />
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{t.events.descriptionLabel}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detaillierte Beschreibung..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              {/* Category & Severity */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>{t.events.categoryLabel} *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t.events.severityLabel} *</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <MapPin size={14} />
                  {t.events.locationLabel} *
                </label>
                <div className={styles.locationInputs}>
                  <div className={styles.coordInput}>
                    <span>Lat</span>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="0.0001"
                      required
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.coordInput}>
                    <span>Lng</span>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="0.0001"
                      required
                      className={styles.input}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isPickingLocation ? 'primary' : 'ghost'}
                  size="sm"
                  icon={<Crosshair size={14} />}
                  onClick={() => setIsPickingLocation(!isPickingLocation)}
                  fullWidth
                >
                  {isPickingLocation ? t.events.clickOnMap : t.events.pickOnMap}
                </Button>
              </div>

              {/* Date/Time */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Clock size={14} />
                  Datum & Uhrzeit *
                </label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>

              {/* Source URL */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Link size={14} />
                  Quell-URL
                </label>
                <input
                  type="url"
                  name="sourceUrl"
                  value={formData.sourceUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className={styles.input}
                />
              </div>

              {/* Tags */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Tag size={14} />
                  {t.events.tagsLabel}
                </label>
                <div className={styles.tagInput}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Tag hinzufügen..."
                    className={styles.input}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTag}
                  >
                    +
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className={styles.tagList}>
                    {formData.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                >
                  Event erstellen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Events List */}
      <div className={styles.pendingSection}>
        <h4 className={styles.sectionTitle}>Ausstehende Überprüfung</h4>
        <div className={styles.pendingList}>
          {events.filter((e) => !e.verified).slice(0, 5).map((event) => (
            <div key={event.id} className={styles.pendingItem}>
              <div className={styles.pendingInfo}>
                <span
                  className={styles.pendingCategory}
                  style={{ color: CATEGORY_CONFIG[event.category].color }}
                >
                  {CATEGORY_CONFIG[event.category].label}
                </span>
                <span className={styles.pendingTitle}>{event.title}</span>
              </div>
              <div className={styles.pendingActions}>
                <IconButton
                  aria-label={t.admin.verify}
                  icon={<CheckCircle size={14} />}
                  size="sm"
                  onClick={() => {
                    useMapStore.getState().updateEvent(event.id, { verified: true });
                  }}
                />
                <IconButton
                  aria-label={t.app.delete}
                  icon={<Trash2 size={14} />}
                  size="sm"
                  onClick={() => {
                    useMapStore.getState().removeEvent(event.id);
                  }}
                />
              </div>
            </div>
          ))}
          {events.filter((e) => !e.verified).length === 0 && (
            <p className={styles.emptyText}>{t.events.noPending}</p>
          )}
        </div>
      </div>
    </div>
  );
};
