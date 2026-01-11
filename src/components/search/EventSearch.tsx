import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    Search,
    X,
    MapPin,
    Clock,
    Command,
    AlertTriangle
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { CATEGORY_CONFIG } from '../../types/database';
import styles from './EventSearch.module.css';

interface SearchResult {
    id: string;
    title: string;
    category: string;
    severity: string;
    date: Date;
    coordinates: [number, number];
}

export const EventSearch: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const events = useMapStore((state) => state.events);
    const setViewState = useMapStore((state) => state.setViewState);
    const setSelectedEventId = useMapStore((state) => state.setSelectedEventId);

    // Search results
    const results = useMemo<SearchResult[]>(() => {
        if (!query.trim()) return [];

        const searchTerm = query.toLowerCase();
        return events
            .filter(e => {
                const text = `${e.title} ${e.description || ''} ${e.category}`.toLowerCase();
                return text.includes(searchTerm);
            })
            .slice(0, 8)
            .map(e => ({
                id: e.id,
                title: e.title,
                category: e.category,
                severity: e.severity,
                date: e.eventDate,
                coordinates: e.coordinates
            }));
    }, [events, query]);

    // Recent searches (top events by default)
    const recentEvents = useMemo<SearchResult[]>(() => {
        return events
            .filter(e => e.severity === 'critical' || e.severity === 'high')
            .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
            .slice(0, 5)
            .map(e => ({
                id: e.id,
                title: e.title,
                category: e.category,
                severity: e.severity,
                date: e.eventDate,
                coordinates: e.coordinates
            }));
    }, [events]);

    const displayResults = query.trim() ? results : recentEvents;

    // Keyboard shortcut to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle selection - defined before handleKeyDown to avoid access before declaration
    const handleSelect = useCallback((result: SearchResult) => {
        setViewState({
            longitude: result.coordinates[0],
            latitude: result.coordinates[1],
            zoom: 10
        });
        setSelectedEventId(result.id);
        setIsOpen(false);
        setQuery('');
    }, [setViewState, setSelectedEventId]);

    // Navigate results with keyboard
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, displayResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && displayResults[selectedIndex]) {
            handleSelect(displayResults[selectedIndex]);
        }
    }, [displayResults, selectedIndex, handleSelect]);

    const getCategoryConfig = (category: string) => {
        return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    };

    if (!isOpen) {
        return (
            <button
                className={styles.searchButton}
                onClick={() => setIsOpen(true)}
                title="Suche öffnen (⌘K)"
            >
                <Search size={16} />
                <span className={styles.searchButtonText}>Suche...</span>
                <div className={styles.shortcut}>
                    <Command size={10} />
                    <span>K</span>
                </div>
            </button>
        );
    }

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.inputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Events suchen..."
                        className={styles.input}
                    />
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.results}>
                    {displayResults.length === 0 && query.trim() && (
                        <div className={styles.noResults}>
                            <Search size={24} />
                            <span>Keine Ergebnisse für "{query}"</span>
                        </div>
                    )}

                    {displayResults.length > 0 && (
                        <>
                            <div className={styles.resultsHeader}>
                                {query.trim() ? 'Ergebnisse' : 'Aktuelle kritische Events'}
                            </div>

                            {displayResults.map((result, index) => {
                                const categoryConfig = getCategoryConfig(result.category);
                                return (
                                    <button
                                        key={result.id}
                                        className={`${styles.resultItem} ${index === selectedIndex ? styles.resultItemSelected : ''}`}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div
                                            className={styles.resultIcon}
                                            style={{ color: categoryConfig?.color }}
                                        >
                                            {result.severity === 'critical' ? (
                                                <AlertTriangle size={14} />
                                            ) : (
                                                <MapPin size={14} />
                                            )}
                                        </div>
                                        <div className={styles.resultContent}>
                                            <span className={styles.resultTitle}>
                                                {result.title.length > 60
                                                    ? result.title.substring(0, 60) + '...'
                                                    : result.title}
                                            </span>
                                            <div className={styles.resultMeta}>
                                                <span
                                                    className={styles.resultCategory}
                                                    style={{ color: categoryConfig?.color }}
                                                >
                                                    {categoryConfig?.label || result.category}
                                                </span>
                                                <Clock size={10} />
                                                <span>{result.date.toLocaleDateString('de-DE')}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerHint}>
                        <span className={styles.key}>↑↓</span> navigieren
                    </div>
                    <div className={styles.footerHint}>
                        <span className={styles.key}>↵</span> auswählen
                    </div>
                    <div className={styles.footerHint}>
                        <span className={styles.key}>esc</span> schließen
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventSearch;
