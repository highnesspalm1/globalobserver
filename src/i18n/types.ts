// Internationalization Types for Global Observer

export type Language = 'de' | 'en' | 'tr';

export interface TranslationKeys {
  // App-wide
  app: {
    title: string;
    subtitle: string;
    name: string;
    tagline: string;
    loading: string;
    error: string;
    close: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    reset: string;
    refresh: string;
    share: string;
    export: string;
    settings: string;
    help: string;
    back: string;
    next: string;
    previous: string;
    yes: string;
    no: string;
    ok: string;
    apply: string;
    clear: string;
    selectAll: string;
    deselectAll: string;
    confirm: string;
    skip: string;
    start: string;
    stop: string;
    play: string;
    pause: string;
    more: string;
    less: string;
    show: string;
    hide: string;
    open: string;
    minimize: string;
    maximize: string;
    viewSource: string;
    goToLocation: string;
    unknown: string;
    noResults: string;
    selected: string;
    all: string;
  };

  // Header
  header: {
    title: string;
    subtitle: string;
    lastUpdate: string;
    refreshing: string;
    events: string;
    liveData: string;
    offline: string;
    online: string;
    live: string;
    localTime: string;
    loading: string;
  };

  // Map
  map: {
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    fullscreen: string;
    exitFullscreen: string;
    coordinates: string;
    style: string;
    dark: string;
    satellite: string;
    terrain: string;
    tactical: string;
    skipToMap: string;
    interactiveMap: string;
    copyCoordinates: string;
    lat: string;
    lng: string;
  };

  // Events
  events: {
    title: string;
    noEvents: string;
    loading: string;
    verified: string;
    unverified: string;
    source: string;
    date: string;
    category: string;
    severity: string;
    location: string;
    description: string;
    tags: string;
    media: string;
    details: string;
    recent: string;
    unknown: string;
    relatedEvents: string;
    noRelatedEvents: string;
    history: string;
    position: string;
    pending: string;
    noPending: string;
    create: string;
    titleLabel: string;
    descriptionLabel: string;
    categoryLabel: string;
    severityLabel: string;
    locationLabel: string;
    tagsLabel: string;
    sourceLabel: string;
    pickOnMap: string;
    clickOnMap: string;
  };

  // Categories
  categories: {
    all: string;
    combat: string;
    shelling: string;
    air_raid: string;
    airRaid: string;
    drone: string;
    naval: string;
    explosion: string;
    terrorism: string;
    protest: string;
    political: string;
    humanitarian: string;
    infrastructure: string;
    weapons: string;
    movement: string;
  };

  // Severity
  severity: {
    all: string;
    low: string;
    medium: string;
    high: string;
    critical: string;
  };

  // Sidebar
  sidebar: {
    title: string;
    filters: string;
    layers: string;
    legend: string;
    recentEvents: string;
    statistics: string;
    open: string;
    close: string;
  };

  // Filters
  filters: {
    title: string;
    categories: string;
    severity: string;
    timeRange: string;
    verifiedOnly: string;
    dateFrom: string;
    dateTo: string;
    last24h: string;
    last7days: string;
    last30days: string;
    customRange: string;
    dateRange: string;
    from: string;
    to: string;
    reset: string;
  };

  // Layers
  layers: {
    title: string;
    events: string;
    territories: string;
    heatmap: string;
    frontlines: string;
    conflictZones: string;
    show3D: string;
    styles: {
      dark: string;
      satellite: string;
      terrain: string;
      tactical: string;
    };
    mapStyle: string;
    dataLayers: string;
    eventsDesc: string;
    territoriesDesc: string;
    frontlinesDesc: string;
    heatmapDesc: string;
    viewOptions: string;
    view3D: string;
    view3DDesc: string;
    legend: string;
    legendUkraine: string;
    legendOccupied: string;
    legendContested: string;
    legendLiberated: string;
  };

  // Statistics
  stats: {
    title: string;
    totalEvents: string;
    activeConflicts: string;
    criticalAlerts: string;
    dataSourcesActive: string;
    lastHour: string;
    today: string;
    thisWeek: string;
    threatLevel: string;
    low: string;
    elevated: string;
    high: string;
    severe: string;
    critical: string;
    visible: string;
    medium: string;
    total: string;
    live: string;
  };

  // Timeline
  timeline: {
    title: string;
    play: string;
    pause: string;
    speed: string;
    today: string;
    eventTimeline: string;
    openTimeline: string;
    previousDay: string;
    nextDay: string;
    allRegions: string;
    allCategories: string;
    eventsCount: string;
  };

  // Search
  search: {
    placeholder: string;
    noResults: string;
    searching: string;
    resultsFound: string;
    searchIn: string;
    titles: string;
    descriptions: string;
    locations: string;
    noResultsFor: string;
    recentSearches: string;
    clearHistory: string;
  };

  // Bookmarks
  bookmarks: {
    title: string;
    add: string;
    remove: string;
    noBookmarks: string;
    saved: string;
    managedBookmarks: string;
    currentPosition: string;
    saveDescription: string;
    namePlaceholder: string;
  };

  // Share
  share: {
    title: string;
    copyLink: string;
    copied: string;
    shareOn: string;
    embedCode: string;
    downloadImage: string;
    shareEvent: string;
    shareView: string;
    mapView: string;
    currentPosition: string;
    includesPosition: string;
    qrCode: string;
    scanQrCode: string;
    shareTitle: string;
    shareEventText: string;
    shareViewText: string;
  };

  // Export
  export: {
    title: string;
    format: string;
    dateRange: string;
    includeMedia: string;
    download: string;
    generating: string;
    success: string;
    successDetail: string;
    error: string;
    errorDetail: string;
  };

  // Settings
  settings: {
    title: string;
    language: string;
    theme: string;
    notifications: string;
    autoRefresh: string;
    autoRefreshDesc: string;
    refreshInterval: string;
    mapStyle: string;
    units: string;
    metric: string;
    imperial: string;
    privacy: string;
    about: string;
    display: string;
    pushNotifications: string;
    pushNotificationsDesc: string;
    soundEffects: string;
    defaultMapStyle: string;
    showWelcome: string;
    reset: string;
    criticalEventsAlert: string;
  };

  // Notifications
  notifications: {
    title: string;
    enable: string;
    disable: string;
    noNotifications: string;
    markAllRead: string;
    clearAll: string;
    newEvent: string;
    criticalAlert: string;
    dataUpdated: string;
  };

  // Welcome Screen
  welcome: {
    title: string;
    subtitle: string;
    description: string;
    features: {
      realtime: string;
      realtimeDesc: string;
      layers: string;
      layersDesc: string;
      timeline: string;
      timelineDesc: string;
      filters: string;
      filtersDesc: string;
      export: string;
      exportDesc: string;
      shortcuts: string;
      shortcutsDesc: string;
    };
    getStarted: string;
    dontShowAgain: string;
    welcomeTo: string;
    tracking: string;
    multiLayer: string;
    maps: string;
    data: string;
    powerfulFeatures: string;
    close: string;
    step: string;
    back: string;
    next: string;
  };

  // Keyboard Shortcuts
  shortcuts: {
    title: string;
    navigation: string;
    zoomIn: string;
    zoomOut: string;
    resetView: string;
    toggleSidebar: string;
    toggleLayers: string;
    toggleTimeline: string;
    focusSearch: string;
    search: string;
    refresh: string;
    help: string;
    escape: string;
    clearSelection: string;
    showHelp: string;
    mapControls: string;
    panels: string;
    other: string;
    panUp: string;
    panDown: string;
    panLeft: string;
    panRight: string;
  };

  // Alerts
  alerts: {
    title: string;
    hotspots: string;
    newAlert: string;
    critical: string;
    warning: string;
    info: string;
    noAlerts: string;
    noHotspots: string;
  };

  // Data Sources
  dataSources: {
    title: string;
    status: string;
    active: string;
    inactive: string;
    error: string;
    lastSync: string;
    gdelt: string;
    reliefweb: string;
    rss: string;
    nasa: string;
    usgs: string;
    wikipedia: string;
  };

  // Regions
  regions: {
    title: string;
    highlights: string;
    ukraine: string;
    gaza: string;
    syria: string;
    yemen: string;
    sudan: string;
    myanmar: string;
    sahel: string;
    middleEast: string;
    europe: string;
    asia: string;
    africa: string;
    americas: string;
    ukraineRussia: string;
    gazaIsrael: string;
    iran: string;
    mostActive: string;
  };

  // Compare Mode
  compare: {
    title: string;
    selectRegions: string;
    period: string;
    metrics: string;
    eventCount: string;
    severityDistribution: string;
    categoryBreakdown: string;
    endCompare: string;
    activateSplit: string;
    stopAnimation: string;
    startAnimation: string;
    splitModeHint: string;
    // Time presets
    todayVsYesterday: string;
    thisWeekVsLastWeek: string;
    thisMonthVsLastMonth: string;
    thisYearVsLastYear: string;
    // Date labels
    timePointA: string;
    timePointB: string;
    // Stats
    eventsLabel: string;
    more: string;
    fewer: string;
    same: string;
    byCategory: string;
  };

  // Heatmap
  heatmap: {
    title: string;
    intensity: string;
    timeRange: string;
    animate: string;
    stop: string;
    speed: string;
    playing: string;
    paused: string;
    // Additional labels
    events: string;
    eventsTooltip: string;
    // Config
    showSettings: string;
    hideSettings: string;
    startDate: string;
    endDate: string;
    stepSize: string;
    oneDay: string;
    oneWeek: string;
    oneMonth: string;
    // Controls
    backToStart: string;
    toEnd: string;
    // Info
    heatmapInfo: string;
    heatmapActive: string;
  };

  // Analytics
  analytics: {
    title: string;
    overview: string;
    trends: string;
    distribution: string;
    byCategory: string;
    byRegion: string;
    bySeverity: string;
    overTime: string;
  };

  // Admin
  admin: {
    title: string;
    addEvent: string;
    editEvent: string;
    deleteEvent: string;
    verify: string;
    unverify: string;
    pickLocation: string;
    panel: string;
    exitMode: string;
    eventsTab: string;
    pendingTab: string;
    required: string;
  };

  // System Status
  system: {
    status: string;
    online: string;
    offline: string;
    connecting: string;
    lastUpdate: string;
    version: string;
    dataQuality: string;
    performance: string;
    active: string;
    build: string;
    memory: string;
    ping: string;
    fps: string;
    connection: string;
    uptime: string;
  };

  // Error Messages
  errors: {
    loadingFailed: string;
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    timeout: string;
    tryAgain: string;
    contactSupport: string;
    noData: string;
    errorOccurred: string;
    applicationError: string;
    showTechnicalDetails: string;
    copyError: string;
    goHome: string;
    reload: string;
    reportBug: string;
    unknownError: string;
    stackTraceNotAvailable: string;
  };

  // Success Messages
  success: {
    saved: string;
    deleted: string;
    updated: string;
    copied: string;
    exported: string;
    subscribed: string;
    dataLoaded: string;
  };

  // Time
  time: {
    now: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    lastWeek: string;
    thisMonth: string;
    lastMonth: string;
    never: string;
    secondsAgo: string;
    minute: string;
    minutes: string;
  };

  // Footer
  footer: {
    copyright: string;
    privacy: string;
    terms: string;
    contact: string;
    github: string;
  };

  // UI Components
  ui: {
    modal: {
      close: string;
    };
    dropdown: {
      noResults: string;
      selected: string;
    };
    loading: string;
    loadingLiveData: string;
  };

  // Quick Actions
  quickActions: {
    title: string;
    open: string;
    minimize: string;
    mapStyle: string;
    layers: string;
    darkMode: string;
    satelliteMode: string;
    terrainMode: string;
    tacticalMode: string;
    fullscreen: string;
    exitFullscreen: string;
    showEvents: string;
    hideEvents: string;
    showHeatmap: string;
    hideHeatmap: string;
    show3D: string;
    hide3D: string;
    showFrontlines: string;
    hideFrontlines: string;
  };

  // Threat Level
  threat: {
    level: string;
    low: string;
    guarded: string;
    elevated: string;
    high: string;
    critical: string;
    lowDesc: string;
    guardedDesc: string;
    elevatedDesc: string;
    highDesc: string;
    criticalDesc: string;
  };

  // Activity Feed
  activity: {
    title: string;
    noActivity: string;
  };

  // Onboarding Tour
  onboarding: {
    welcome: string;
    welcomeTitle: string;
    welcomeDesc: string;
    askTour: string;
    startTour: string;
    skipTour: string;
    steps: {
      map: {
        title: string;
        description: string;
      };
      sidebar: {
        title: string;
        description: string;
      };
      timeline: {
        title: string;
        description: string;
      };
      layers: {
        title: string;
        description: string;
      };
      search: {
        title: string;
        description: string;
      };
      filters: {
        title: string;
        description: string;
      };
      export: {
        title: string;
        description: string;
      };
      complete: {
        title: string;
        description: string;
      };
    };
  };
}

export type Translations = {
  [key in Language]: TranslationKeys;
};
