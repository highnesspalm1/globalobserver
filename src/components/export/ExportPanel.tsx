import React, { useState, useCallback, useMemo } from 'react';
import {
    Download,
    FileJson,
    FileSpreadsheet,
    Map,
    X,
    Calendar,
    Filter,
    Check,
    Loader
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { useMapStore } from '../../stores/mapStore';
import { CATEGORY_CONFIG } from '../../types/database';
import type { EventCategory, MapEvent } from '../../types/database';
import styles from './ExportPanel.module.css';

type ExportFormat = 'geojson' | 'csv' | 'kml';

interface ExportOptions {
    format: ExportFormat;
    dateFrom: string;
    dateTo: string;
    categories: EventCategory[];
    verifiedOnly: boolean;
}

const ExportPanel: React.FC = () => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportComplete, setExportComplete] = useState(false);
    const events = useMapStore((state) => state.events);

    // Stable dates to avoid purity violations
    const [today] = useState(() => new Date().toISOString().split('T')[0]);
    const [thirtyDaysAgo] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const [options, setOptions] = useState<ExportOptions>({
        format: 'geojson',
        dateFrom: thirtyDaysAgo,
        dateTo: today,
        categories: Object.keys(CATEGORY_CONFIG) as EventCategory[],
        verifiedOnly: false
    });

    // Filter events based on options
    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = event.eventDate.toISOString().split('T')[0];
            if (eventDate < options.dateFrom || eventDate > options.dateTo) return false;
            if (!options.categories.includes(event.category)) return false;
            if (options.verifiedOnly && !event.verified) return false;
            return true;
        });
    }, [events, options]);

    const exportToGeoJSON = (data: MapEvent[]): string => {
        const features = data.map(event => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: event.coordinates
            },
            properties: {
                id: event.id,
                title: event.title,
                description: event.description,
                category: event.category,
                severity: event.severity,
                eventDate: event.eventDate.toISOString(),
                verified: event.verified,
                sourceUrl: event.sourceUrl,
                tags: event.tags
            }
        }));

        return JSON.stringify({
            type: 'FeatureCollection',
            features
        }, null, 2);
    };

    const exportToCSV = (data: MapEvent[]): string => {
        const headers = ['id', 'title', 'description', 'category', 'severity', 'latitude', 'longitude', 'eventDate', 'verified', 'sourceUrl'];
        const rows = data.map(event => [
            event.id,
            `"${(event.title || '').replace(/"/g, '""')}"`,
            `"${(event.description || '').replace(/"/g, '""')}"`,
            event.category,
            event.severity,
            event.coordinates[1],
            event.coordinates[0],
            event.eventDate.toISOString(),
            event.verified,
            event.sourceUrl || ''
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    };

    const exportToKML = (data: MapEvent[]): string => {
        const placemarks = data.map(event => `
    <Placemark>
      <name>${event.title}</name>
      <description>${event.description || ''}</description>
      <Point>
        <coordinates>${event.coordinates[0]},${event.coordinates[1]},0</coordinates>
      </Point>
      <ExtendedData>
        <Data name="category"><value>${event.category}</value></Data>
        <Data name="severity"><value>${event.severity}</value></Data>
        <Data name="eventDate"><value>${event.eventDate.toISOString()}</value></Data>
      </ExtendedData>
    </Placemark>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Global Observer Export</name>
    <description>Exported events from Global Observer</description>
    ${placemarks}
  </Document>
</kml>`;
    };

    const handleExport = useCallback(async () => {
        setIsExporting(true);

        // Simulate processing time for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        let content: string;
        let filename: string;
        let mimeType: string;

        switch (options.format) {
            case 'geojson':
                content = exportToGeoJSON(filteredEvents);
                filename = `globalobserver_export_${today}.geojson`;
                mimeType = 'application/geo+json';
                break;
            case 'csv':
                content = exportToCSV(filteredEvents);
                filename = `globalobserver_export_${today}.csv`;
                mimeType = 'text/csv';
                break;
            case 'kml':
                content = exportToKML(filteredEvents);
                filename = `globalobserver_export_${today}.kml`;
                mimeType = 'application/vnd.google-earth.kml+xml';
                break;
        }

        // Create and trigger download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setExportComplete(true);
        setTimeout(() => setExportComplete(false), 3000);
    }, [filteredEvents, options.format, today]);

    const toggleCategory = (category: EventCategory) => {
        setOptions(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    if (!isOpen) {
        return (
            <button
                className={styles.toggleButton}
                onClick={() => setIsOpen(true)}
                title="Daten exportieren"
            >
                <Download size={16} />
            </button>
        );
    }

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Download size={18} />
                        <span>{t.export.title}</span>
                    </div>
                    <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Format Selection */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t.export.format}</h3>
                        <div className={styles.formatGrid}>
                            <button
                                className={`${styles.formatOption} ${options.format === 'geojson' ? styles.active : ''}`}
                                onClick={() => setOptions(prev => ({ ...prev, format: 'geojson' }))}
                            >
                                <FileJson size={24} />
                                <span>GeoJSON</span>
                            </button>
                            <button
                                className={`${styles.formatOption} ${options.format === 'csv' ? styles.active : ''}`}
                                onClick={() => setOptions(prev => ({ ...prev, format: 'csv' }))}
                            >
                                <FileSpreadsheet size={24} />
                                <span>CSV</span>
                            </button>
                            <button
                                className={`${styles.formatOption} ${options.format === 'kml' ? styles.active : ''}`}
                                onClick={() => setOptions(prev => ({ ...prev, format: 'kml' }))}
                            >
                                <Map size={24} />
                                <span>KML</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Calendar size={14} />
                            {t.export.dateRange}
                        </h3>
                        <div className={styles.dateRange}>
                            <input
                                type="date"
                                value={options.dateFrom}
                                onChange={e => setOptions(prev => ({ ...prev, dateFrom: e.target.value }))}
                                className={styles.dateInput}
                            />
                            <span className={styles.dateSeparator}>{t.filters.to}</span>
                            <input
                                type="date"
                                value={options.dateTo}
                                onChange={e => setOptions(prev => ({ ...prev, dateTo: e.target.value }))}
                                className={styles.dateInput}
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Filter size={14} />
                            Kategorien ({options.categories.length})
                        </h3>
                        <div className={styles.categoryGrid}>
                            {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).slice(0, 8).map(category => {
                                const config = CATEGORY_CONFIG[category];
                                const isSelected = options.categories.includes(category);
                                return (
                                    <button
                                        key={category}
                                        className={`${styles.categoryChip} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => toggleCategory(category)}
                                        style={{
                                            borderColor: isSelected ? config.color : undefined,
                                            color: isSelected ? config.color : undefined
                                        }}
                                    >
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Options */}
                    <div className={styles.section}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={options.verifiedOnly}
                                onChange={e => setOptions(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                            />
                            <span>Nur verifizierte Ereignisse</span>
                        </label>
                    </div>

                    {/* Export Summary */}
                    <div className={styles.summary}>
                        <span className={styles.summaryLabel}>Ereignisse zum Export:</span>
                        <span className={styles.summaryValue}>{filteredEvents.length}</span>
                    </div>

                    {/* Export Button */}
                    <button
                        className={`${styles.exportButton} ${exportComplete ? styles.complete : ''}`}
                        onClick={handleExport}
                        disabled={isExporting || filteredEvents.length === 0}
                    >
                        {isExporting ? (
                            <>
                                <Loader size={18} className={styles.spinner} />
                                Exportiere...
                            </>
                        ) : exportComplete ? (
                            <>
                                <Check size={18} />
                                Export erfolgreich!
                            </>
                        ) : (
                            <>
                                <Download size={18} />
                                {filteredEvents.length} Ereignisse exportieren
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportPanel;
