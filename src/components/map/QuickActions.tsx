import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Navigation,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Grid,
  MapPin,
  Map,
  Mountain,
  Satellite,
  Target,
  Camera,
  Share2,
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n } from '../../i18n';
import { Tooltip } from '../ui/Tooltip';
import styles from './QuickActions.module.css';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  active?: boolean;
  group?: string;
}

interface QuickActionsProps {
  map?: maplibregl.Map | null;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ map }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { t } = useI18n();

  const {
    mapStyle,
    setMapStyle,
    show3D,
    setShow3D,
    showEvents,
    setShowEvents,
    showHeatmap,
    setShowHeatmap,
  } = useMapStore();

  const handleZoomIn = () => {
    map?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    map?.zoomOut({ duration: 300 });
  };

  const handleResetView = () => {
    map?.flyTo({
      center: [31.1656, 48.3794], // Ukraine center
      zoom: 6,
      bearing: 0,
      pitch: 0,
      duration: 1500,
    });
  };

  const handleRotateNorth = () => {
    map?.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 500,
    });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleScreenshot = () => {
    if (!map) return;

    const canvas = map.getCanvas();
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `globalobserver-screenshot-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = () => {
    const center = map?.getCenter();
    const zoom = map?.getZoom();
    if (center && zoom) {
      const url = `${window.location.origin}?lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}&z=${zoom.toFixed(1)}`;
      navigator.clipboard.writeText(url);
    }
  };

  const zoomActions: QuickAction[] = [
    { id: 'zoom-in', icon: <Plus size={18} />, label: 'Hineinzoomen', shortcut: '+', onClick: handleZoomIn },
    { id: 'zoom-out', icon: <Minus size={18} />, label: 'Herauszoomen', shortcut: '-', onClick: handleZoomOut },
  ];

  const viewActions: QuickAction[] = [
    { id: 'reset', icon: <RotateCcw size={18} />, label: 'Ansicht zurücksetzen', onClick: handleResetView },
    { id: 'north', icon: <Compass size={18} />, label: 'Nach Norden ausrichten', onClick: handleRotateNorth },
    { id: '3d', icon: <Mountain size={18} />, label: '3D-Ansicht', onClick: () => setShow3D(!show3D), active: show3D },
    {
      id: 'fullscreen',
      icon: isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />,
      label: isFullscreen ? t.quickActions.exitFullscreen : t.quickActions.fullscreen,
      shortcut: 'F11',
      onClick: handleToggleFullscreen
    },
  ];

  const styleActions: QuickAction[] = [
    { id: 'dark', icon: <Map size={16} />, label: t.quickActions.darkMode, onClick: () => setMapStyle('dark'), active: mapStyle === 'dark' },
    { id: 'satellite', icon: <Satellite size={16} />, label: t.quickActions.satelliteMode, onClick: () => setMapStyle('satellite'), active: mapStyle === 'satellite' },
    { id: 'terrain', icon: <Mountain size={16} />, label: t.quickActions.terrainMode, onClick: () => setMapStyle('terrain'), active: mapStyle === 'terrain' },
    { id: 'tactical', icon: <Target size={16} />, label: t.quickActions.tacticalMode, onClick: () => setMapStyle('tactical'), active: mapStyle === 'tactical' },
  ];

  const dataActions: QuickAction[] = [
    { id: 'events', icon: <MapPin size={18} />, label: 'Events', onClick: () => setShowEvents(!showEvents), active: showEvents },
    { id: 'heatmap', icon: <Grid size={18} />, label: 'Heatmap', onClick: () => setShowHeatmap(!showHeatmap), active: showHeatmap },
  ];

  const utilityActions: QuickAction[] = [
    { id: 'screenshot', icon: <Camera size={18} />, label: 'Screenshot', onClick: handleScreenshot },
    { id: 'share', icon: <Share2 size={18} />, label: 'Position teilen', onClick: handleShare },
  ];

  const renderActionButton = (action: QuickAction) => (
    <Tooltip key={action.id} content={action.label} position="left">
      <button
        className={`${styles.actionButton} ${action.active ? styles.active : ''}`}
        onClick={action.onClick}
        aria-label={action.label}
      >
        {action.icon}
        {action.shortcut && <span className={styles.shortcut}>{action.shortcut}</span>}
      </button>
    </Tooltip>
  );

  if (!isExpanded) {
    return (
      <div className={styles.container}>
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(true)}
          aria-label={t.quickActions.open}
        >
          <Navigation size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        {/* Zoom Controls */}
        <div className={styles.group}>
          {zoomActions.map(renderActionButton)}
        </div>

        <div className={styles.separator} />

        {/* View Controls */}
        <div className={styles.group}>
          {viewActions.map(renderActionButton)}
        </div>

        <div className={styles.separator} />

        {/* Map Style */}
        <div className={styles.group}>
          <div className={styles.styleButtons}>
            {styleActions.map((action) => (
              <Tooltip key={action.id} content={action.label} position="left">
                <button
                  className={`${styles.styleButton} ${action.active ? styles.styleActive : ''}`}
                  onClick={action.onClick}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className={styles.separator} />

        {/* Data Toggles */}
        <div className={styles.group}>
          {dataActions.map(renderActionButton)}
        </div>

        <div className={styles.separator} />

        {/* Utilities */}
        <div className={styles.group}>
          {utilityActions.map(renderActionButton)}
        </div>

        {/* Collapse Button */}
        <button
          className={styles.collapseButton}
          onClick={() => setIsExpanded(false)}
          aria-label={t.quickActions.minimize}
        >
          <Minimize2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
