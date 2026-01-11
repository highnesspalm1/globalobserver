import React from 'react';
import styles from './Divider.module.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted' | 'gradient';
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  className = '',
}) => {
  if (label && orientation === 'horizontal') {
    return (
      <div className={`${styles.labeledDivider} ${className}`}>
        <span className={`${styles.line} ${styles[variant]}`} />
        <span className={styles.label}>{label}</span>
        <span className={`${styles.line} ${styles[variant]}`} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.divider} ${styles[orientation]} ${styles[variant]} ${className}`}
      role="separator"
    />
  );
};

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  axis?: 'horizontal' | 'vertical';
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
}) => {
  const sizes = {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
  };

  const style = axis === 'vertical'
    ? { height: sizes[size] }
    : { width: sizes[size], display: 'inline-block' };

  return <div style={style} />;
};

export default Divider;
