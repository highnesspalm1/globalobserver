import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { MapEvent, MapTerritory, EventCategory, TerritoryActor, SeverityLevel } from '../types/database';

interface MapFilters {
  categories: EventCategory[];
  actors: TerritoryActor[];
  severities: SeverityLevel[];
  verifiedOnly: boolean;
  searchQuery: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface TimeRange {
  start: Date;
  end: Date;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface MapState {
  // View State
  viewState: ViewState;
  setViewState: (viewState: Partial<ViewState>) => void;

  // Time Controls
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  // Filters
  filters: MapFilters;
  setFilters: (filters: Partial<MapFilters>) => void;
  toggleCategory: (category: EventCategory) => void;
  toggleActor: (actor: TerritoryActor) => void;
  toggleSeverity: (severity: SeverityLevel) => void;
  resetFilters: () => void;

  // Data
  events: MapEvent[];
  setEvents: (events: MapEvent[]) => void;
  addEvent: (event: MapEvent) => void;
  updateEvent: (id: string, event: Partial<MapEvent>) => void;
  removeEvent: (id: string) => void;

  territories: MapTerritory[];
  setTerritories: (territories: MapTerritory[]) => void;

  // Selection
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedTerritoryId: string | null;
  setSelectedTerritoryId: (id: string | null) => void;
  hoveredEventId: string | null;
  setHoveredEventId: (id: string | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  layerPanelOpen: boolean;
  setLayerPanelOpen: (open: boolean) => void;
  timelineOpen: boolean;
  setTimelineOpen: (open: boolean) => void;
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;

  // Admin Location Picking
  isPickingLocation: boolean;
  setIsPickingLocation: (picking: boolean) => void;
  pickedLocation: [number, number] | null;
  setPickedLocation: (location: [number, number] | null) => void;

  // Layer Visibility
  showEvents: boolean;
  setShowEvents: (show: boolean) => void;
  showTerritories: boolean;
  setShowTerritories: (show: boolean) => void;
  showFrontlines: boolean;
  setShowFrontlines: (show: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  show3D: boolean;
  setShow3D: (show: boolean) => void;

  // Map Style
  mapStyle: 'dark' | 'satellite' | 'terrain' | 'tactical';
  setMapStyle: (style: 'dark' | 'satellite' | 'terrain' | 'tactical') => void;

  // Loading State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const DEFAULT_FILTERS: MapFilters = {
  categories: [],
  actors: [],
  severities: [],
  verifiedOnly: true,
  searchQuery: '',
  dateRange: {
    start: null,
    end: null,
  },
};

// Load saved preferences from localStorage
function loadSavedPreferences() {
  try {
    const saved = localStorage.getItem('globalobserver-preferences');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading preferences:', e);
  }
  return null;
}

// Save preferences to localStorage
function savePreferences(prefs: {
  mapStyle?: string;
  showEvents?: boolean;
  showTerritories?: boolean;
  showHeatmap?: boolean;
  show3D?: boolean;
  sidebarOpen?: boolean;
}) {
  try {
    const existing = loadSavedPreferences() || {};
    localStorage.setItem('globalobserver-preferences', JSON.stringify({ ...existing, ...prefs }));
  } catch (e) {
    console.error('Error saving preferences:', e);
  }
}

const savedPrefs = loadSavedPreferences();

// Default to world view (centered globally)
const DEFAULT_VIEW_STATE: ViewState = {
  longitude: 20,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

// Default time range: last 7 days
const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

export const useMapStore = create<MapState>()(
  subscribeWithSelector((set) => ({
    // View State
    viewState: DEFAULT_VIEW_STATE,
    setViewState: (viewState) =>
      set((state) => ({
        viewState: { ...state.viewState, ...viewState },
      })),

    // Time Controls
    selectedDate: now,
    setSelectedDate: (date) => set({ selectedDate: date }),
    timeRange: { start: weekAgo, end: now },
    setTimeRange: (range) => set({ timeRange: range }),
    isPlaying: false,
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    playbackSpeed: 1,
    setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

    // Filters
    filters: DEFAULT_FILTERS,
    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
    toggleCategory: (category) =>
      set((state) => {
        const categories = state.filters.categories.includes(category)
          ? state.filters.categories.filter((c) => c !== category)
          : [...state.filters.categories, category];
        return { filters: { ...state.filters, categories } };
      }),
    toggleActor: (actor) =>
      set((state) => {
        const actors = state.filters.actors.includes(actor)
          ? state.filters.actors.filter((a) => a !== actor)
          : [...state.filters.actors, actor];
        return { filters: { ...state.filters, actors } };
      }),
    toggleSeverity: (severity) =>
      set((state) => {
        const severities = state.filters.severities.includes(severity)
          ? state.filters.severities.filter((s) => s !== severity)
          : [...state.filters.severities, severity];
        return { filters: { ...state.filters, severities } };
      }),
    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    // Data
    events: [],
    setEvents: (events) => set({ events }),
    addEvent: (event) =>
      set((state) => ({
        events: [event, ...state.events],
      })),
    updateEvent: (id, eventUpdate) =>
      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...eventUpdate } : e
        ),
      })),
    removeEvent: (id) =>
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      })),

    territories: [],
    setTerritories: (territories) => set({ territories }),

    // Selection
    selectedEventId: null,
    setSelectedEventId: (id) => set({ selectedEventId: id }),
    selectedTerritoryId: null,
    setSelectedTerritoryId: (id) => set({ selectedTerritoryId: id }),
    hoveredEventId: null,
    setHoveredEventId: (id) => set({ hoveredEventId: id }),

    // UI State
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    layerPanelOpen: false,
    setLayerPanelOpen: (open) => set({ layerPanelOpen: open }),
    timelineOpen: true,
    setTimelineOpen: (open) => set({ timelineOpen: open }),
    adminMode: false,
    setAdminMode: (mode) => set({ adminMode: mode }),

    // Admin Location Picking
    isPickingLocation: false,
    setIsPickingLocation: (picking) => set({ isPickingLocation: picking }),
    pickedLocation: null,
    setPickedLocation: (location) => set({ pickedLocation: location }),

    // Layer Visibility - Load from saved preferences
    showEvents: savedPrefs?.showEvents ?? true,
    setShowEvents: (show) => {
      savePreferences({ showEvents: show });
      set({ showEvents: show });
    },
    showTerritories: savedPrefs?.showTerritories ?? true,
    setShowTerritories: (show) => {
      savePreferences({ showTerritories: show });
      set({ showTerritories: show });
    },
    showFrontlines: true,
    setShowFrontlines: (show) => set({ showFrontlines: show }),
    showHeatmap: savedPrefs?.showHeatmap ?? false,
    setShowHeatmap: (show) => {
      savePreferences({ showHeatmap: show });
      set({ showHeatmap: show });
    },
    show3D: savedPrefs?.show3D ?? false,
    setShow3D: (show) => {
      savePreferences({ show3D: show });
      set({ show3D: show });
    },

    // Map Style - Load from saved preferences
    mapStyle: savedPrefs?.mapStyle ?? 'dark',
    setMapStyle: (style) => {
      savePreferences({ mapStyle: style });
      set({ mapStyle: style });
    },

    // Loading State
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
    error: null,
    setError: (error) => set({ error }),
  }))
);

// Selectors
export const selectFilteredEvents = (state: MapState): MapEvent[] => {
  const { events, filters, timeRange } = state;

  return events.filter((event) => {
    // Time filter
    const eventTime = event.eventDate.getTime();
    if (eventTime < timeRange.start.getTime() || eventTime > timeRange.end.getTime()) {
      return false;
    }

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

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description?.toLowerCase().includes(query);
      const matchesTags = event.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    return true;
  });
};

export const selectFilteredTerritories = (state: MapState): MapTerritory[] => {
  const { territories, filters, selectedDate } = state;
  const selectedTime = selectedDate.getTime();

  return territories.filter((territory) => {
    // Time filter - show territories valid at selected date
    const validFromTime = territory.validFrom.getTime();
    const validToTime = territory.validTo?.getTime() ?? Infinity;

    if (selectedTime < validFromTime || selectedTime > validToTime) {
      return false;
    }

    // Actor filter
    if (filters.actors.length > 0 && !filters.actors.includes(territory.actor)) {
      return false;
    }

    return true;
  });
};

export const selectEventById = (state: MapState, id: string): MapEvent | undefined => {
  return state.events.find((e) => e.id === id);
};

export const selectTerritoryById = (state: MapState, id: string): MapTerritory | undefined => {
  return state.territories.find((t) => t.id === id);
};

// Stats selectors
export const selectEventStats = (state: MapState) => {
  const filtered = selectFilteredEvents(state);

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  filtered.forEach((event) => {
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
  });

  return {
    total: filtered.length,
    byCategory,
    bySeverity,
    verified: filtered.filter((e) => e.verified).length,
    unverified: filtered.filter((e) => !e.verified).length,
  };
};
