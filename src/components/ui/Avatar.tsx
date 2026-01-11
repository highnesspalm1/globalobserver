import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  shape?: 'circle' | 'square';
  border?: boolean;
  className?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    'var(--camo-accent)',
    'var(--success-green)',
    'var(--info-blue)',
    'var(--warning-amber)',
    'var(--camo-medium)',
    'var(--camo-light)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '',
  size = 'md',
  status,
  shape = 'circle',
  border = false,
  className = '',
}) => {
  const initials = getInitials(name || '?');
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${styles[shape]} ${border ? styles.bordered : ''} ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className={styles.image} />
      ) : (
        <span className={styles.initials} style={{ backgroundColor: bgColor }}>
          {initials}
        </span>
      )}
      {status && <span className={`${styles.status} ${styles[`status-${status}`]}`} />}
    </div>
  );
};

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  size = 'md',
  className = '',
}) => {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div className={`${styles.avatarGroup} ${styles[size]} ${className}`}>
      {visible.map((child, index) => (
        <div key={index} className={styles.groupItem}>
          {React.isValidElement<AvatarProps>(child)
            ? React.cloneElement(child, { size, border: true })
            : child}
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${styles.avatar} ${styles[size]} ${styles.circle} ${styles.bordered} ${styles.remainingCount}`}>
          <span className={styles.initials}>+{remaining}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
