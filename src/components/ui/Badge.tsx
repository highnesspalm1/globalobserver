import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'camo';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  className = '',
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    pulse ? styles.pulse : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      {dot && <span className={styles.dot} />}
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </span>
  );
};

interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.group} ${className}`}>
      {children}
    </div>
  );
};
