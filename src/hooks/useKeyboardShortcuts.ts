import { useEffect, useCallback } from 'react';
import { useMapStore } from '../stores/mapStore';

export const useKeyboardShortcuts = () => {
  const {
    setSidebarOpen,
    sidebarOpen,
    setLayerPanelOpen,
    layerPanelOpen,
    setTimelineOpen,
    timelineOpen,
    setAdminMode,
    adminMode,
    setIsPlaying,
    isPlaying,
    setSelectedDate,
    selectedDate,
    timeRange,
    setViewState,
    viewState,
    resetFilters,
    setSelectedEventId,
  } = useMapStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Keyboard shortcuts
    switch (e.key.toLowerCase()) {
      // Toggle Sidebar: S
      case 's':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setSidebarOpen(!sidebarOpen);
        }
        break;

      // Toggle Layer Panel: L
      case 'l':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setLayerPanelOpen(!layerPanelOpen);
        }
        break;

      // Toggle Timeline: T
      case 't':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setTimelineOpen(!timelineOpen);
        }
        break;

      // Toggle Admin Mode: A
      case 'a':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setAdminMode(!adminMode);
        }
        break;

      // Play/Pause Timeline: Space
      case ' ':
        e.preventDefault();
        setIsPlaying(!isPlaying);
        break;

      // Previous Day: ArrowLeft
      case 'arrowleft':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const prevDate = new Date(selectedDate);
          prevDate.setDate(prevDate.getDate() - 1);
          if (prevDate >= timeRange.start) {
            setSelectedDate(prevDate);
          }
        }
        break;

      // Next Day: ArrowRight
      case 'arrowright':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const nextDate = new Date(selectedDate);
          nextDate.setDate(nextDate.getDate() + 1);
          if (nextDate <= timeRange.end) {
            setSelectedDate(nextDate);
          }
        }
        break;

      // Zoom In: +/=
      case '+':
      case '=':
        e.preventDefault();
        setViewState({ zoom: Math.min(viewState.zoom + 1, 18) });
        break;

      // Zoom Out: -
      case '-':
        e.preventDefault();
        setViewState({ zoom: Math.max(viewState.zoom - 1, 1) });
        break;

      // Reset Filters: R
      case 'r':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          resetFilters();
        }
        break;

      // Close Panel/Deselect: Escape
      case 'escape':
        setSelectedEventId(null);
        break;

      // Go to Today: Home
      case 'home': {
        e.preventDefault();
        const today = new Date();
        if (today >= timeRange.start && today <= timeRange.end) {
          setSelectedDate(today);
        } else {
          setSelectedDate(timeRange.end);
        }
        break;
      }
    }
  }, [
    sidebarOpen, setSidebarOpen,
    layerPanelOpen, setLayerPanelOpen,
    timelineOpen, setTimelineOpen,
    adminMode, setAdminMode,
    isPlaying, setIsPlaying,
    selectedDate, setSelectedDate, timeRange,
    viewState, setViewState,
    resetFilters, setSelectedEventId
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Keyboard shortcuts info component
export const KeyboardShortcutsInfo = () => {
  const shortcuts = [
    { key: 'S', description: 'Sidebar ein/aus' },
    { key: 'L', description: 'Layer-Panel ein/aus' },
    { key: 'T', description: 'Timeline ein/aus' },
    { key: 'A', description: 'Admin-Modus ein/aus' },
    { key: 'Space', description: 'Play/Pause' },
    { key: '←/→', description: 'Tag vor/zurück' },
    { key: '+/-', description: 'Zoom' },
    { key: 'R', description: 'Filter zurücksetzen' },
    { key: 'Esc', description: 'Schließen' },
    { key: 'Home', description: 'Zu heute' },
  ];

  return shortcuts;
};
