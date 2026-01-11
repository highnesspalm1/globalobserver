import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, X, Flame, Clock, GitCompare, Share2, Bookmark
} from 'lucide-react';
import styles from './FloatingMenu.module.css';

interface FloatingMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  badge?: number;
}

interface FloatingMenuProps {
  items: FloatingMenuItem[];
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.container}`)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handleItemClick = useCallback((item: FloatingMenuItem) => {
    item.onClick();
    setIsOpen(false);
  }, []);

  return (
    <div className={styles.container}>
      {/* Menu Items */}
      <div className={`${styles.menuItems} ${isOpen ? styles.open : ''}`}>
        {items.map((item, index) => (
          <button
            key={item.id}
            className={`${styles.menuItem} ${item.isActive ? styles.active : ''}`}
            onClick={() => handleItemClick(item)}
            title={item.label}
            style={{ 
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              transform: isOpen ? 'scale(1) translateX(0)' : 'scale(0) translateX(20px)',
              opacity: isOpen ? 1 : 0
            }}
          >
            {item.icon}
            {item.badge !== undefined && item.badge > 0 && (
              <span className={styles.badge}>{item.badge}</span>
            )}
            <span className={styles.tooltip}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Menü schließen' : 'Werkzeuge öffnen'}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
};

// Pre-configured menu for map tools
export const MapToolsMenu: React.FC = () => {
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set());

  const toggleTool = useCallback((toolId: string) => {
    setActiveTools(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });

    // Dispatch custom event for tool activation
    window.dispatchEvent(new CustomEvent('toggleMapTool', { 
      detail: { toolId } 
    }));
  }, []);

  const items: FloatingMenuItem[] = [
    {
      id: 'heatmap',
      icon: <Flame size={20} />,
      label: 'Heatmap Timelapse',
      onClick: () => toggleTool('heatmap'),
      isActive: activeTools.has('heatmap')
    },
    {
      id: 'timeline',
      icon: <Clock size={20} />,
      label: 'Event Timeline',
      onClick: () => toggleTool('timeline'),
      isActive: activeTools.has('timeline')
    },
    {
      id: 'compare',
      icon: <GitCompare size={20} />,
      label: 'Vergleichsmodus',
      onClick: () => toggleTool('compare'),
      isActive: activeTools.has('compare')
    },
    {
      id: 'share',
      icon: <Share2 size={20} />,
      label: 'Teilen',
      onClick: () => toggleTool('share'),
      isActive: activeTools.has('share')
    },
    {
      id: 'bookmarks',
      icon: <Bookmark size={20} />,
      label: 'Lesezeichen',
      onClick: () => toggleTool('bookmarks'),
      isActive: activeTools.has('bookmarks')
    }
  ];

  return <FloatingMenu items={items} />;
};

export default FloatingMenu;
