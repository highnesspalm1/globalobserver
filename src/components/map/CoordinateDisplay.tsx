import React, { useState } from 'react';
import { Crosshair, Copy, Check } from 'lucide-react';
import { useI18n } from '../../i18n';
import styles from './CoordinateDisplay.module.css';

interface CoordinateDisplayProps {
  coordinates: [number, number] | null;
}

export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ coordinates }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const formatCoordinate = (coord: number, isLat: boolean) => {
    const direction = isLat 
      ? (coord >= 0 ? 'N' : 'S')
      : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(4)}°${direction}`;
  };

  const handleCopy = async () => {
    if (!coordinates) return;
    const text = `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!coordinates) return null;

  return (
    <div className={styles.coordinateDisplay}>
      <Crosshair size={14} className={styles.icon} />
      <span className={styles.lat}>
        {formatCoordinate(coordinates[1], true)}
      </span>
      <span className={styles.separator}>|</span>
      <span className={styles.lng}>
        {formatCoordinate(coordinates[0], false)}
      </span>
      <button 
        className={styles.copyButton} 
        onClick={handleCopy}
        title={t.map.copyCoordinates}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
};
