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
import styles from './KeyboardShortcuts.module.css';

interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string[]; description: string; icon?: React.ReactNode }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: 'Navigation',
        shortcuts: [
            { keys: ['⌘', 'K'], description: 'Suche öffnen', icon: <Search size={14} /> },
            { keys: ['S'], description: 'Sidebar ein/aus' },
            { keys: ['L'], description: 'Layer-Panel ein/aus', icon: <Layers size={14} /> },
            { keys: ['T'], description: 'Timeline ein/aus', icon: <Clock size={14} /> },
            { keys: ['Home'], description: 'Globale Ansicht', icon: <Home size={14} /> },
        ]
    },
    {
        title: 'Kartensteuerung',
        shortcuts: [
            { keys: ['+'], description: 'Hineinzoomen', icon: <Plus size={14} /> },
            { keys: ['-'], description: 'Herauszoomen', icon: <Minus size={14} /> },
            { keys: ['R'], description: 'Karte zurücksetzen', icon: <Globe size={14} /> },
            { keys: ['3'], description: '3D-Ansicht umschalten' },
        ]
    },
    {
        title: 'Filter & Daten',
        shortcuts: [
            { keys: ['F'], description: 'Filter-Fokus', icon: <Filter size={14} /> },
            { keys: ['V'], description: 'Nur verifizierte Events' },
            { keys: ['C'], description: 'Kritische Events filtern' },
            { keys: ['E'], description: 'Daten exportieren', icon: <Download size={14} /> },
        ]
    },
    {
        title: 'Allgemein',
        shortcuts: [
            { keys: ['?'], description: 'Diese Hilfe anzeigen' },
            { keys: ['Esc'], description: 'Auswahl aufheben / Schließen' },
            { keys: ['Space'], description: 'Timeline abspielen/pausieren' },
        ]
    }
];

export const KeyboardShortcuts: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

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
                title="Tastaturkürzel anzeigen (?)"
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
                        <span>Tastaturkürzel</span>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.content}>
                    {SHORTCUT_GROUPS.map((group, groupIndex) => (
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
                    <span>Drücke</span>
                    <kbd className={styles.key}>?</kbd>
                    <span>um diese Hilfe zu öffnen</span>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;
