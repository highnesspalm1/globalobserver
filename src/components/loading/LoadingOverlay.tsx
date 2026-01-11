import React from 'react';
import { useMapStore } from '../../stores/mapStore';
import { Loader2, Check, AlertCircle, Globe, Database, Rss, Satellite, Activity } from 'lucide-react';
import styles from './LoadingOverlay.module.css';

// Map source IDs to icons
const SOURCE_ICONS: Record<string, React.ReactNode> = {
  'GDELT Geopolitical': <Globe size={16} />,
  'ReliefWeb Humanitarian': <Database size={16} />,
  'RSS News Feeds': <Rss size={16} />,
  'NASA Natural Events': <Satellite size={16} />,
  'USGS Earthquakes': <Activity size={16} />,
};

export const LoadingOverlay: React.FC = () => {
  const isLoading = useMapStore((state) => state.isLoading);
  const loadingProgress = useMapStore((state) => state.loadingProgress);
  const events = useMapStore((state) => state.events);

  if (!isLoading) return null;

  const { current, total, currentSource, loadedSources } = loadingProgress;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Logo/Icon */}
        <div className={styles.logo}>
          <Globe className={styles.logoIcon} size={48} />
        </div>

        {/* Title */}
        <h2 className={styles.title}>Global Observer</h2>
        <p className={styles.subtitle}>Lade Live-Daten...</p>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={styles.progressText}>{percentage}%</span>
        </div>

        {/* Current Source */}
        <div className={styles.currentSource}>
          <Loader2 className={styles.spinner} size={16} />
          <span>{currentSource || 'Initialisiere...'}</span>
        </div>

        {/* Source List */}
        <div className={styles.sourceList}>
          {['GDELT Geopolitical', 'ReliefWeb Humanitarian', 'RSS News Feeds', 'NASA Natural Events', 'USGS Earthquakes'].map((source) => {
            const isLoaded = loadedSources.includes(source) || loadedSources.includes(`${source} (Fehler)`);
            const hasError = loadedSources.includes(`${source} (Fehler)`);
            const isCurrent = currentSource === source;

            return (
              <div 
                key={source} 
                className={`${styles.sourceItem} ${isLoaded ? styles.loaded : ''} ${isCurrent ? styles.current : ''} ${hasError ? styles.error : ''}`}
              >
                <span className={styles.sourceIcon}>
                  {isLoaded ? (
                    hasError ? <AlertCircle size={14} /> : <Check size={14} />
                  ) : isCurrent ? (
                    <Loader2 className={styles.spinnerSmall} size={14} />
                  ) : (
                    SOURCE_ICONS[source] || <Database size={14} />
                  )}
                </span>
                <span className={styles.sourceName}>{source}</span>
              </div>
            );
          })}
        </div>

        {/* Event Counter */}
        {events.length > 0 && (
          <div className={styles.eventCounter}>
            <Activity size={14} />
            <span>{events.length} Ereignisse geladen</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
