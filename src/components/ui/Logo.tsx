import React from 'react';
import { Globe, Radio } from 'lucide-react';
import styles from './Logo.module.css';

interface LogoProps {
  variant?: 'full' | 'compact';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full' }) => {
  return (
    <div className={styles.logo} data-variant={variant}>
      <div className={styles.iconWrapper}>
        <Globe className={styles.globeIcon} size={variant === 'full' ? 24 : 20} />
        <Radio className={styles.radioIcon} size={variant === 'full' ? 12 : 10} />
        <div className={styles.pulse} />
      </div>
      {variant === 'full' && (
        <div className={styles.text}>
          <span className={styles.title}>GLOBAL OBSERVER</span>
          <span className={styles.subtitle}>Conflict Intelligence</span>
        </div>
      )}
    </div>
  );
};
