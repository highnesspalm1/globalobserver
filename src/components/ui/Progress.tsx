import React from 'react';
import styles from './Progress.module.css';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'camo';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'camo',
  size = 'md',
  showLabel = false,
  animated = false,
  striped = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const classNames = [
    styles.progress,
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  const barClassNames = [
    styles.bar,
    styles[variant],
    animated ? styles.animated : '',
    striped ? styles.striped : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className={styles.track}>
        <div
          className={barClassNames}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'camo';
  showLabel?: boolean;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  variant = 'camo',
  showLabel = true,
  children,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.ringSvg}>
        <circle
          className={styles.ringTrack}
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${styles.ringBar} ${styles[`ring-${variant}`]}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className={styles.ringContent}>
        {children || (showLabel && (
          <span className={styles.ringLabel}>{Math.round(percentage)}%</span>
        ))}
      </div>
    </div>
  );
};
