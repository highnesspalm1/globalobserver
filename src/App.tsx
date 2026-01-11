import { useEffect, useMemo, lazy, Suspense, useState, useCallback } from 'react';
import { MapView } from './components/map/MapView';
import { Sidebar } from './components/sidebar/Sidebar';
import { TimeSlider } from './components/timeline/TimeSlider';
import { LayerPanel } from './components/layers/LayerPanel';
import { StatsBar } from './components/stats/StatsBar';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { QuickActions } from './components/map/QuickActions';
import { useMapStore } from './stores/mapStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { notify } from './stores/notificationStore';
import { fetchAllLiveEvents, getConflictZones } from './services/liveDataService';
import type { MapTerritory } from './types/database';
import { I18nProvider, useI18n } from './i18n';
import styles from './App.module.css';

// Lazy load heavy components
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const EventDetailPanel = lazy(() => import('./components/event/EventDetailPanel').then(m => ({ default: m.EventDetailPanel })));
const WelcomeScreen = lazy(() => import('./components/welcome/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));

// Lazy load premium dashboard components
const ThreatLevel = lazy(() => import('./components/stats/ThreatLevel'));
const DataSourceStatus = lazy(() => import('./components/stats/DataSourceStatus'));
const RegionHighlights = lazy(() => import('./components/regions/RegionHighlights'));
const HotspotAlerts = lazy(() => import('./components/alerts/HotspotAlerts'));

// Lazy load Phase 2 components
const LiveEventTicker = lazy(() => import('./components/ticker/LiveEventTicker'));
const EventSearch = lazy(() => import('./components/search/EventSearch'));

// Lazy load Phase 3 components
const KeyboardShortcuts = lazy(() => import('./components/help/KeyboardShortcuts'));

// Lazy load Phase 4 components
const HeaderBar = lazy(() => import('./components/header/HeaderBar'));
const ConflictStats = lazy(() => import('./components/stats/ConflictStats'));
const SystemStatus = lazy(() => import('./components/status/SystemStatus'));

// Lazy load Phase 5 components
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const ExportPanel = lazy(() => import('./components/export/ExportPanel'));
const SettingsPanel = lazy(() => import('./components/settings/SettingsPanel'));

// Lazy load new components
const Bookmarks = lazy(() => import('./components/bookmarks/Bookmarks'));
const PushNotifications = lazy(() => import('./components/notifications/PushNotifications'));
const SkeletonMap = lazy(() => import('./components/ui/SkeletonMap'));

// Lazy load Priorität 2 & 3 components
const OnboardingTour = lazy(() => import('./components/onboarding/OnboardingTour'));
const SharePanel = lazy(() => import('./components/share/SharePanel'));
const CompareMode = lazy(() => import('./components/compare/CompareMode'));
const EventTimeline = lazy(() => import('./components/timeline/EventTimeline'));
const HeatmapTimelapse = lazy(() => import('./components/heatmap/HeatmapTimelapse'));

// Lazy load Floating Menu
const FloatingMenu = lazy(() => import('./components/ui/FloatingMenu').then(m => ({ default: m.MapToolsMenu })));

// Loading fallback component
const LoadingFallback = () => (
  <div className={styles.loadingFallback}>
    <div className={styles.loadingSpinner} />
  </div>
);

// Convert conflict zones to territories for map visualization
function conflictZonesToTerritories(): MapTerritory[] {
  const zones = getConflictZones();
  return zones.map(zone => ({
    id: zone.id,
    actor: zone.intensity === 'critical' ? 'contested' :
      zone.intensity === 'high' ? 'occupied' : 'contested',
    coordinates: zone.coordinates,
    validFrom: new Date('2024-01-01'),
    validTo: null,
    changeReason: zone.description
  }));
}

// Auto-refresh interval: 5 minutes
const REFRESH_INTERVAL = 5 * 60 * 1000;

// Inner App component that uses i18n
function AppContent() {
  const { setEvents, setTerritories, isLoading, error, selectedEventId, setSelectedEventId } = useMapStore();
  const events = useMapStore((state) => state.events);
  const { t } = useI18n();
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has dismissed welcome screen before
    return localStorage.getItem('globalobserver-welcome-dismissed') !== 'true';
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Find selected event
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(e => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  const handleWelcomeDismiss = () => {
    setShowWelcome(false);
  };

  const handleWelcomeShowAgain = (show: boolean) => {
    if (!show) {
      localStorage.setItem('globalobserver-welcome-dismissed', 'true');
    } else {
      localStorage.removeItem('globalobserver-welcome-dismissed');
    }
  };

  // Load live data function
  const loadLiveData = useCallback(async () => {
    useMapStore.getState().setIsLoading(true);
    useMapStore.getState().setError(null);

    try {
      // Fetch live events from all sources
      const liveEvents = await fetchAllLiveEvents();

      if (liveEvents.length > 0) {
        setEvents(liveEvents);
        setLastRefresh(new Date());
        notify.success(t.success.dataLoaded, `${liveEvents.length} ${t.header.events}`);
      } else {
        notify.warning(t.errors.noData, t.errors.noData);
      }

      // Load conflict zones as territories
      const territories = conflictZonesToTerritories();
      setTerritories(territories);


    } catch (err) {
      console.error('Error loading live data:', err);
      useMapStore.getState().setError(t.errors.loadingFailed);
      notify.error(t.errors.loadingFailed, t.errors.loadingFailed);
    } finally {
      useMapStore.getState().setIsLoading(false);
    }
  }, [setEvents, setTerritories]);

  // Load live data on mount
  useEffect(() => {
    loadLiveData();

    // Welcome notification
    notify.info(t.app.title, t.header.loading);
  }, [loadLiveData, t]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live data...');
      loadLiveData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadLiveData]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadLiveData();
    setIsRefreshing(false);
  }, [loadLiveData]);

  return (
    <div className={styles.app} role="application" aria-label={`${t.app.title} - ${t.app.subtitle}`}>
      {/* Skip Navigation Link für Accessibility */}
      <a href="#main-map" className="skip-link">
        {t.map.skipToMap}
      </a>
      
      <div className={styles.backgroundPattern} aria-hidden="true" />

      {/* Header Bar */}
      <Suspense fallback={null}>
        <HeaderBar
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
          eventCount={events.length}
        />
      </Suspense>

      <main id="main-map" className={styles.mapWrapper} role="main" aria-label={t.map.interactiveMap}>
        <MapView />
      </main>

      <StatsBar />
      <Sidebar />
      <LayerPanel />
      <QuickActions />

      {/* Premium Dashboard Panel */}
      <div className={styles.dashboardPanel}>
        <Suspense fallback={null}>
          <ThreatLevel />
          <ConflictStats />
          <HotspotAlerts />
          <RegionHighlights />
          <DataSourceStatus />
        </Suspense>
      </div>

      {/* Search Bar */}
      <Suspense fallback={null}>
        <EventSearch />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <AdminPanel />
      </Suspense>

      {/* Live Event Ticker */}
      <Suspense fallback={null}>
        <LiveEventTicker />
      </Suspense>

      {/* Keyboard Shortcuts Help */}
      <Suspense fallback={null}>
        <KeyboardShortcuts />
      </Suspense>

      {/* Phase 5: Analytics, Export, Settings */}
      <Suspense fallback={null}>
        <AnalyticsDashboard />
        <ExportPanel />
        <SettingsPanel />
      </Suspense>

      <TimeSlider />
      <NotificationCenter />

      {/* Floating Action Menu - central control for tools */}
      <Suspense fallback={null}>
        <FloatingMenu />
      </Suspense>

      {/* Tool Panels (controlled by FloatingMenu) */}
      <Suspense fallback={null}>
        <Bookmarks />
        <SharePanel />
        <CompareMode />
        <EventTimeline />
        <HeatmapTimelapse />
      </Suspense>

      {/* Push Notifications */}
      <Suspense fallback={null}>
        <PushNotifications />
      </Suspense>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <Suspense fallback={<LoadingFallback />}>
          <EventDetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEventId(null)}
          />
        </Suspense>
      )}

      {/* Welcome Screen */}
      {showWelcome && (
        <Suspense fallback={null}>
          <WelcomeScreen
            onDismiss={handleWelcomeDismiss}
            onShowAgain={handleWelcomeShowAgain}
          />
        </Suspense>
      )}

      {/* Onboarding Tour */}
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>

      {isLoading && (
        <Suspense fallback={
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>{t.header.loading}</span>
            </div>
          </div>
        }>
          <SkeletonMap />
        </Suspense>
      )}

      {error && (
        <div className={styles.errorToast}>
          <span>{error}</span>
          <button onClick={() => useMapStore.getState().setError(null)}>×</button>
        </div>
      )}

      {/* System Status Footer */}
      <Suspense fallback={null}>
        <SystemStatus />
      </Suspense>
    </div>
  );
}

// Main App component with I18nProvider
function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
