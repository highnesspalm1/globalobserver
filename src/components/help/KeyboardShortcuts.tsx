import React, { useState, useEffect } from 'react';
import {
    Keyboard,
    X,
    Search,
    Layers,
    Clock,
    Home,
    Plus,
    Minus,
    Globe,
    Filter,
    Download
} from 'lucide-react';
import { useI18n } from '../../i18n';
import styles from './KeyboardShortcuts.module.css';

interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string[]; description: string; icon?: React.ReactNode }[];
}

const getShortcutGroups = (t: ReturnType<typeof import('../../i18n').useI18n>['t']): ShortcutGroup[] => [
    {
        title: t.shortcuts.navigation,
        shortcuts: [
            { keys: ['⌘', 'K'], description: t.shortcuts.search, icon: <Search size={14} /> },
            { keys: ['S'], description: t.shortcuts.toggleSidebar },
            { keys: ['L'], description: t.shortcuts.toggleLayers, icon: <Layers size={14} /> },
            { keys: ['T'], description: t.shortcuts.toggleTimeline, icon: <Clock size={14} /> },
            { keys: ['Home'], description: t.shortcuts.resetView, icon: <Home size={14} /> },
        ]
    },
    {
        title: t.shortcuts.mapControls,
        shortcuts: [
            { keys: ['+'], description: t.shortcuts.zoomIn, icon: <Plus size={14} /> },
            { keys: ['-'], description: t.shortcuts.zoomOut, icon: <Minus size={14} /> },
            { keys: ['R'], description: t.shortcuts.resetView, icon: <Globe size={14} /> },
            { keys: ['3'], description: t.map.style },
        ]
    },
    {
        title: t.shortcuts.panels,
        shortcuts: [
            { keys: ['F'], description: t.app.filter, icon: <Filter size={14} /> },
            { keys: ['V'], description: t.events.verified },
            { keys: ['C'], description: t.severity.critical },
            { keys: ['E'], description: t.app.export, icon: <Download size={14} /> },
        ]
    },
    {
        title: t.shortcuts.other,
        shortcuts: [
            { keys: ['?'], description: t.shortcuts.showHelp },
            { keys: ['Esc'], description: t.shortcuts.escape },
            { keys: ['Space'], description: t.app.play + '/' + t.app.pause },
        ]
    }
];

export const KeyboardShortcuts: React.FC = () => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const shortcutGroups = getShortcutGroups(t);

    // Listen for ? key to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ? key (Shift + /)
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                className={styles.helpButton}
                onClick={() => setIsOpen(true)}
                title={`${t.shortcuts.title} (?)`}
            >
                <Keyboard size={14} />
            </button>
        );
    }

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Keyboard size={18} />
                        <span>{t.shortcuts.title}</span>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.content}>
                    {shortcutGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className={styles.group}>
                            <h3 className={styles.groupTitle}>{group.title}</h3>
                            <div className={styles.shortcutList}>
                                {group.shortcuts.map((shortcut, index) => (
                                    <div key={index} className={styles.shortcutItem}>
                                        <div className={styles.shortcutKeys}>
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <React.Fragment key={keyIndex}>
                                                    <kbd className={styles.key}>{key}</kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className={styles.keyPlus}>+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <div className={styles.shortcutInfo}>
                                            {shortcut.icon && (
                                                <span className={styles.shortcutIcon}>{shortcut.icon}</span>
                                            )}
                                            <span className={styles.shortcutDesc}>{shortcut.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <span>{t.shortcuts.showHelp}:</span>
                    <kbd className={styles.key}>?</kbd>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;
