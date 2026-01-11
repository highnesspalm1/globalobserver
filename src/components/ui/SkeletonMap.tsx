import React from 'react';
import { Skeleton, SkeletonListItem } from './Skeleton';
import styles from './SkeletonMap.module.css';

export const SkeletonMap: React.FC = () => (
  <div className={styles.container}>
    {/* Header Skeleton */}
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <Skeleton variant="rounded" width={40} height={40} />
        <div className={styles.headerTitle}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="text" width={100} height={10} />
        </div>
      </div>
      <div className={styles.headerCenter}>
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="text" width={60} height={24} />
      </div>
      <div className={styles.headerRight}>
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>

    {/* Map Area */}
    <div className={styles.mapArea}>
      {/* Fake map markers */}
      <div className={styles.mapMarkers}>
        {[
          { top: '20%', left: '30%', size: 24 },
          { top: '35%', left: '55%', size: 32 },
          { top: '45%', left: '40%', size: 20 },
          { top: '60%', left: '25%', size: 28 },
          { top: '50%', left: '70%', size: 36 },
          { top: '30%', left: '80%', size: 22 },
          { top: '70%', left: '50%', size: 26 },
        ].map((marker, i) => (
          <div
            key={i}
            className={styles.marker}
            style={{
              top: marker.top,
              left: marker.left,
              width: marker.size,
              height: marker.size,
            }}
          />
        ))}
      </div>

      {/* Grid lines */}
      <div className={styles.gridLines}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`h-${i}`} className={styles.gridLineH} style={{ top: `${(i + 1) * 20}%` }} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`v-${i}`} className={styles.gridLineV} style={{ left: `${(i + 1) * 20}%` }} />
        ))}
      </div>
    </div>

    {/* Sidebar Skeleton */}
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Skeleton variant="text" width="60%" height={18} />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <div className={styles.sidebarSearch}>
        <Skeleton variant="rounded" width="100%" height={40} />
      </div>
      <div className={styles.sidebarStats}>
        <Skeleton variant="text" width={50} height={28} />
        <Skeleton variant="text" width={50} height={28} />
        <Skeleton variant="text" width={50} height={28} />
      </div>
      <div className={styles.sidebarList}>
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>

    {/* Stats Bar Skeleton */}
    <div className={styles.statsBar}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.statItem}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={40} height={16} />
        </div>
      ))}
    </div>

    {/* Loading text */}
    <div className={styles.loadingText}>
      <div className={styles.loadingSpinner} />
      <span>Lade Live-Daten...</span>
    </div>
  </div>
);

export default SkeletonMap;
