import React, { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { de, enGB, tr } from 'date-fns/locale';
import {
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bomb,
  Plane,
  Truck,
  Crosshair,
  Radio,
  Anchor,
  Landmark,
  Heart,
  Building,
  Download,
  FileJson,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n } from '../../i18n';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '../../types/database';
import type { EventCategory, SeverityLevel } from '../../types/database';
import { Button, IconButton } from '../ui/Button';
import { exportToGeoJSON, exportToCSV, exportToKML, getExportFilename } from '../../utils/exportUtils';
import { notify } from '../../stores/notificationStore';
import { useSwipeGestures, useEdgeSwipe } from '../../hooks/useSwipeGestures';
import styles from './Sidebar.module.css';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  shelling: <Bomb size={14} />,
  air_raid: <Plane size={14} />,
  movement: <Truck size={14} />,
  combat: <Crosshair size={14} />,
  drone: <Radio size={14} />,
  naval: <Anchor size={14} />,
  political: <Landmark size={14} />,
  humanitarian: <Heart size={14} />,
  infrastructure: <Building size={14} />,
};

export const Sidebar: React.FC = () => {
  const { t, language } = useI18n();
  const dateLocale = language === 'de' ? de : language === 'tr' ? tr : enGB;
  
  const {
    sidebarOpen,
    setSidebarOpen,
    filters,
    setFilters,
    toggleCategory,
    toggleSeverity,
    resetFilters,
    selectedEventId,
    setSelectedEventId,
  } = useMapStore();

  // Swipe gesture to close sidebar
  const sidebarRef = useSwipeGestures<HTMLDivElement>({
    threshold: 50,
    onSwipeLeft: () => setSidebarOpen(false),
  });

  // Edge swipe to open sidebar (when closed)
  useEdgeSwipe({
    edge: 'left',
    edgeWidth: 30,
    threshold: 50,
    onSwipe: () => setSidebarOpen(true),
  });

  // Get events directly from store
  const events = useMapStore((state) => state.events);

  // Memoize filtered events to avoid infinite loops
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      // Severity filter
      if (filters.severities.length > 0 && !filters.severities.includes(event.severity)) {
        return false;
      }
      // Verified filter
      if (filters.verifiedOnly && !event.verified) {
        return false;
      }
      // Date range filter
      if (filters.dateRange.start && event.eventDate < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end) {
        const endOfDay = new Date(filters.dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (event.eventDate > endOfDay) {
          return false;
        }
      }
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          (event.description?.toLowerCase().includes(query) ?? false)
        );
      }
      return true;
    });
  }, [events, filters]);

  // Memoize stats calculation
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let verified = 0;

    filteredEvents.forEach((event) => {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      if (event.verified) verified++;
    });

    return {
      total: filteredEvents.length,
      verified,
      byCategory,
      bySeverity,
    };
  }, [filteredEvents]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [showExport, setShowExport] = useState(false);

  // Export handlers
  const handleExport = useCallback((type: 'geojson' | 'csv' | 'kml') => {
    const filename = getExportFilename('globalobserver-events');

    try {
      switch (type) {
        case 'geojson':
          exportToGeoJSON(filteredEvents, filename);
          break;
        case 'csv':
          exportToCSV(filteredEvents, filename);
          break;
        case 'kml':
          exportToKML(filteredEvents, filename);
          break;
      }
      notify.success(t.export.success, t.export.successDetail.replace('{count}', String(filteredEvents.length)).replace('{format}', type.toUpperCase()));
      setShowExport(false);
    } catch {
      notify.error(t.export.error, t.export.errorDetail);
    }
  }, [filteredEvents, t]);

  // Apply search with debounce
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({ searchQuery });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, setFilters]);

  if (!sidebarOpen) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setSidebarOpen(true)}
        aria-label={t.sidebar.open}
      >
        <ChevronDown size={20} />
      </button>
    );
  }

  // Get category label with i18n
  const getCategoryLabel = (key: string) => {
    const categoryLabels: Record<string, string> = {
      shelling: t.categories.shelling,
      air_raid: t.categories.airRaid,
      movement: t.categories.movement,
      combat: t.categories.combat,
      drone: t.categories.drone,
      naval: t.categories.naval,
      political: t.categories.political,
      humanitarian: t.categories.humanitarian,
      infrastructure: t.categories.infrastructure,
    };
    return categoryLabels[key] || key;
  };

  // Get severity label with i18n
  const getSeverityLabel = (key: string) => {
    const severityLabels: Record<string, string> = {
      low: t.severity.low,
      medium: t.severity.medium,
      high: t.severity.high,
      critical: t.severity.critical,
    };
    return severityLabels[key] || key;
  };

  return (
    <aside ref={sidebarRef} className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.sidebarTitle}>{t.sidebar.events}</span>
        <IconButton
          aria-label={t.sidebar.close}
          icon={<X size={18} />}
          onClick={() => setSidebarOpen(false)}
          size="sm"
        />
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder={t.search.placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            className={styles.clearSearch}
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        className={styles.filterToggle}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={14} />
        <span>{t.filters.title}</span>
        {(filters.categories.length > 0 || filters.severities.length > 0) && (
          <span className={styles.filterCount}>
            {filters.categories.length + filters.severities.length}
          </span>
        )}
        {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          {/* Categories */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>{t.filters.categories}</h4>
            <div className={styles.filterGrid}>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  className={`${styles.filterChip} ${filters.categories.includes(key as EventCategory)
                      ? styles.filterChipActive
                      : ''
                    }`}
                  onClick={() => toggleCategory(key as EventCategory)}
                  style={{
                    '--chip-color': config.color,
                  } as React.CSSProperties}
                >
                  {CATEGORY_ICONS[key]}
                  <span>{getCategoryLabel(key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>{t.filters.severity}</h4>
            <div className={styles.filterGrid}>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  className={`${styles.filterChip} ${filters.severities.includes(key as SeverityLevel)
                      ? styles.filterChipActive
                      : ''
                    }`}
                  onClick={() => toggleSeverity(key as SeverityLevel)}
                  style={{
                    '--chip-color': config.color,
                  } as React.CSSProperties}
                >
                  <span>{getSeverityLabel(key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>{t.filters.dateRange}</h4>
            <div className={styles.dateRangeInputs}>
              <div className={styles.dateInputGroup}>
                <label>{t.filters.from}</label>
                <input
                  type="date"
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFilters({
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    }
                  })}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label>{t.filters.to}</label>
                <input
                  type="date"
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFilters({
                    dateRange: {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    }
                  })}
                  className={styles.dateInput}
                />
              </div>
            </div>
          </div>

          {/* Verified Filter */}
          <div className={styles.filterSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters({ verifiedOnly: e.target.checked })}
                className={styles.checkbox}
              />
              <span>{t.filters.verifiedOnly}</span>
            </label>
          </div>

          {/* Reset Button */}
          <Button variant="ghost" size="sm" onClick={resetFilters} fullWidth>
            {t.filters.reset}
          </Button>
        </div>
      )}

      {/* Export Toggle */}
      <button
        className={styles.filterToggle}
        onClick={() => setShowExport(!showExport)}
      >
        <Download size={14} />
        <span>{t.export.title}</span>
        {showExport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Export Panel */}
      {showExport && (
        <div className={styles.filtersPanel}>
          <p className={styles.exportHint}>{filteredEvents.length} {t.events.title}</p>
          <div className={styles.exportButtons}>
            <button className={styles.exportButton} onClick={() => handleExport('geojson')}>
              <FileJson size={16} />
              <span>GeoJSON</span>
            </button>
            <button className={styles.exportButton} onClick={() => handleExport('csv')}>
              <FileSpreadsheet size={16} />
              <span>CSV</span>
            </button>
            <button className={styles.exportButton} onClick={() => handleExport('kml')}>
              <Globe size={16} />
              <span>KML</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>{t.events.title}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.verified}</span>
          <span className={styles.statLabel}>{t.events.verified}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {stats.byCategory['shelling'] || 0}
          </span>
          <span className={styles.statLabel}>{t.categories.shelling}</span>
        </div>
      </div>

      {/* Event List */}
      <div className={styles.eventList}>
        <h3 className={styles.listTitle}>{t.events.recent}</h3>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyState}>
            <MapPin size={32} />
            <p>{t.events.noEvents}</p>
          </div>
        ) : (
          <div className={styles.events}>
            {filteredEvents.slice(0, 50).map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                isSelected={selectedEventId === event.id}
                onClick={() => setSelectedEventId(event.id)}
                getCategoryLabel={getCategoryLabel}
                getSeverityLabel={getSeverityLabel}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

interface EventListItemProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    category: EventCategory;
    severity: SeverityLevel;
    eventDate: Date;
    verified: boolean;
    sourceUrl: string | null;
  };
  isSelected: boolean;
  onClick: () => void;
  getCategoryLabel: (key: string) => string;
  getSeverityLabel: (key: string) => string;
  dateLocale: Locale;
}

const EventListItem: React.FC<EventListItemProps> = ({
  event,
  isSelected,
  onClick,
  getCategoryLabel,
  getSeverityLabel,
  dateLocale,
}) => {
  const categoryConfig = CATEGORY_CONFIG[event.category];
  const severityConfig = SEVERITY_CONFIG[event.severity];

  return (
    <div
      className={`${styles.eventItem} ${isSelected ? styles.eventItemSelected : ''}`}
      onClick={onClick}
    >
      <div
        className={styles.eventIndicator}
        style={{ backgroundColor: categoryConfig.color }}
      />
      <div className={styles.eventContent}>
        <div className={styles.eventHeader}>
          <span
            className={styles.eventCategory}
            style={{ color: categoryConfig.color }}
          >
            {CATEGORY_ICONS[event.category]}
            {getCategoryLabel(event.category)}
          </span>
          {event.verified ? (
            <CheckCircle size={12} className={styles.verifiedBadge} />
          ) : (
            <AlertTriangle size={12} className={styles.unverifiedBadge} />
          )}
        </div>
        <h4 className={styles.eventTitle}>{event.title}</h4>
        {event.description && (
          <p className={styles.eventDescription}>{event.description}</p>
        )}
        <div className={styles.eventMeta}>
          <span className={styles.eventTime}>
            <Clock size={10} />
            {format(event.eventDate, 'dd.MM. HH:mm', { locale: dateLocale })}
          </span>
          <span
            className={styles.eventSeverity}
            style={{ color: severityConfig.color }}
          >
            {getSeverityLabel(event.severity)}
          </span>
        </div>
      </div>
    </div>
  );
};
