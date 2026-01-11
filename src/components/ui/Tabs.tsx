import React from 'react';
import styles from './Tabs.module.css';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const classNames = [
    styles.tabs,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
          <span className={styles.label}>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={styles.badge}>{tab.badge}</span>
          )}
        </button>
      ))}
      {variant === 'underline' && <div className={styles.indicator} />}
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  id: string;
  activeTab: string;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  id,
  activeTab,
  className = '',
}) => {
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      className={`${styles.panel} ${className}`}
    >
      {children}
    </div>
  );
};
