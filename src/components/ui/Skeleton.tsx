import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const classNames = [
    styles.skeleton,
    styles[variant],
    styles[animation],
    className,
  ].filter(Boolean).join(' ');

  return <div className={classNames} style={style} />;
};

// Preset skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`${styles.textGroup} ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.card} ${className}`}>
    <Skeleton variant="rectangular" height={120} />
    <div className={styles.cardContent}>
      <Skeleton variant="text" width="80%" height={20} />
      <SkeletonText lines={2} />
      <div className={styles.cardFooter}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  </div>
);

export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.listItem} ${className}`}>
    <Skeleton variant="circular" width={40} height={40} />
    <div className={styles.listItemContent}>
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="50%" height={12} />
    </div>
    <Skeleton variant="rounded" width={60} height={24} />
  </div>
);

export const SkeletonStats: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = '',
}) => (
  <div className={`${styles.statsGrid} ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={styles.statItem}>
        <Skeleton variant="text" width={60} height={32} />
        <Skeleton variant="text" width={80} height={12} />
      </div>
    ))}
  </div>
);
