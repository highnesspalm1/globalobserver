import React from 'react';
import {
  Layers,
  Map,
  Satellite,
  Mountain,
  Target,
  Eye,
  EyeOff,
  MapPin,
  Square,
  Minus,
  Flame,
  Box,
  X,
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { IconButton } from '../ui/Button';
import styles from './LayerPanel.module.css';

type MapStyleType = 'dark' | 'satellite' | 'terrain' | 'tactical';

const MAP_STYLE_OPTIONS: { id: MapStyleType; label: string; icon: React.ReactNode }[] = [
  { id: 'dark', label: 'Dark', icon: <Map size={16} /> },
  { id: 'satellite', label: 'Satellit', icon: <Satellite size={16} /> },
  { id: 'terrain', label: 'Terrain', icon: <Mountain size={16} /> },
  { id: 'tactical', label: 'Taktisch', icon: <Target size={16} /> },
];

export const LayerPanel: React.FC = () => {
  const {
    layerPanelOpen,
    setLayerPanelOpen,
    mapStyle,
    setMapStyle,
    showEvents,
    setShowEvents,
    showTerritories,
    setShowTerritories,
    showFrontlines,
    setShowFrontlines,
    showHeatmap,
    setShowHeatmap,
    show3D,
    setShow3D,
  } = useMapStore();

  if (!layerPanelOpen) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setLayerPanelOpen(true)}
        aria-label="Layer-Panel öffnen"
      >
        <Layers size={18} />
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Layers size={16} />
          <span>LAYER</span>
        </div>
        <IconButton
          aria-label="Panel schließen"
          icon={<X size={16} />}
          onClick={() => setLayerPanelOpen(false)}
          size="sm"
        />
      </div>

      {/* Map Style */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Kartenstil</h4>
        <div className={styles.styleGrid}>
          {MAP_STYLE_OPTIONS.map((style) => (
            <button
              key={style.id}
              className={`${styles.styleOption} ${
                mapStyle === style.id ? styles.styleOptionActive : ''
              }`}
              onClick={() => setMapStyle(style.id)}
            >
              {style.icon}
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Layers */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Daten-Layer</h4>
        <div className={styles.layerList}>
          <LayerToggle
            label="Events"
            description="Einzelne Ereignisse auf der Karte"
            icon={<MapPin size={16} />}
            active={showEvents}
            onChange={setShowEvents}
            color="#8fa36f"
          />
          <LayerToggle
            label="Territorien"
            description="Kontrollierte Gebiete"
            icon={<Square size={16} />}
            active={showTerritories}
            onChange={setShowTerritories}
            color="#dc2626"
          />
          <LayerToggle
            label="Frontlinien"
            description="Aktuelle Frontverläufe"
            icon={<Minus size={16} />}
            active={showFrontlines}
            onChange={setShowFrontlines}
            color="#ea580c"
          />
          <LayerToggle
            label="Heatmap"
            description="Ereignisdichte-Visualisierung"
            icon={<Flame size={16} />}
            active={showHeatmap}
            onChange={setShowHeatmap}
            color="#d97706"
          />
        </div>
      </div>

      {/* View Options */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Ansicht</h4>
        <div className={styles.layerList}>
          <LayerToggle
            label="3D-Ansicht"
            description="Perspektivische Kartenneigung"
            icon={<Box size={16} />}
            active={show3D}
            onChange={setShow3D}
            color="#0284c7"
          />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Legende</h4>
        <div className={styles.legend}>
          <div className={styles.legendGroup}>
            <span className={styles.legendLabel}>Territorien</span>
            <div className={styles.legendItems}>
              <LegendItem color="rgba(0, 87, 183, 0.5)" label="Ukraine" />
              <LegendItem color="rgba(220, 38, 38, 0.5)" label="Besetzt" />
              <LegendItem color="rgba(234, 88, 12, 0.5)" label="Umkämpft" />
              <LegendItem color="rgba(22, 163, 74, 0.5)" label="Befreit" />
            </div>
          </div>
          <div className={styles.legendGroup}>
            <span className={styles.legendLabel}>Schweregrad</span>
            <div className={styles.legendItems}>
              <LegendItem color="#16a34a" label="Niedrig" type="dot" />
              <LegendItem color="#d97706" label="Mittel" type="dot" />
              <LegendItem color="#dc2626" label="Hoch" type="dot" />
              <LegendItem color="#7f1d1d" label="Kritisch" type="dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LayerToggleProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onChange: (active: boolean) => void;
  color: string;
}

const LayerToggle: React.FC<LayerToggleProps> = ({
  label,
  description,
  icon,
  active,
  onChange,
  color,
}) => {
  return (
    <div
      className={`${styles.layerItem} ${active ? styles.layerItemActive : ''}`}
      onClick={() => onChange(!active)}
    >
      <div className={styles.layerIcon} style={{ color }}>
        {icon}
      </div>
      <div className={styles.layerInfo}>
        <span className={styles.layerLabel}>{label}</span>
        <span className={styles.layerDescription}>{description}</span>
      </div>
      <div className={styles.layerToggle}>
        {active ? (
          <Eye size={16} className={styles.toggleIconActive} />
        ) : (
          <EyeOff size={16} className={styles.toggleIconInactive} />
        )}
      </div>
    </div>
  );
};

interface LegendItemProps {
  color: string;
  label: string;
  type?: 'square' | 'dot';
}

const LegendItem: React.FC<LegendItemProps> = ({
  color,
  label,
  type = 'square',
}) => {
  return (
    <div className={styles.legendItem}>
      <div
        className={type === 'dot' ? styles.legendDot : styles.legendSquare}
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
};
