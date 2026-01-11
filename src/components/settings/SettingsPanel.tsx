import React, { useState, useCallback } from 'react';
import {
    Settings,
    X,
    Clock,
    Bell,
    Map,
    Globe,
    Palette,
    Volume2,
    VolumeX,
    RefreshCw,
    Monitor
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import styles from './SettingsPanel.module.css';

interface AppSettings {
    autoRefresh: boolean;
    refreshInterval: number;
    notifications: boolean;
    soundEffects: boolean;
    language: 'de' | 'en';
    defaultMapStyle: 'dark' | 'satellite' | 'terrain' | 'tactical';
    showWelcomeOnStart: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    autoRefresh: true,
    refreshInterval: 5,
    notifications: true,
    soundEffects: false,
    language: 'de',
    defaultMapStyle: 'dark',
    showWelcomeOnStart: true
};

const SettingsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const setMapStyle = useMapStore((state) => state.setMapStyle);

    // Load settings from localStorage
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('globalobserver-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    const saveSettings = useCallback((newSettings: AppSettings) => {
        setSettings(newSettings);
        localStorage.setItem('globalobserver-settings', JSON.stringify(newSettings));
    }, []);

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);

        // Apply immediate changes
        if (key === 'defaultMapStyle') {
            setMapStyle(value as 'dark' | 'satellite' | 'terrain' | 'tactical');
        }
    };

    const resetSettings = () => {
        saveSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('globalobserver-welcome-dismissed');
    };

    if (!isOpen) {
        return (
            <button
                className={styles.toggleButton}
                onClick={() => setIsOpen(true)}
                title="Einstellungen"
            >
                <Settings size={16} />
            </button>
        );
    }

    return (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Settings size={18} />
                        <span>EINSTELLUNGEN</span>
                    </div>
                    <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Auto-Refresh Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <RefreshCw size={14} />
                            Auto-Aktualisierung
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Auto-Refresh</span>
                                <span className={styles.settingDescription}>Automatische Datenaktualisierung</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoRefresh}
                                    onChange={e => updateSetting('autoRefresh', e.target.checked)}
                                />
                                <span className={styles.toggleSwitch} />
                            </label>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Clock size={14} />
                                <span className={styles.settingLabel}>Interval</span>
                            </div>
                            <select
                                value={settings.refreshInterval}
                                onChange={e => updateSetting('refreshInterval', Number(e.target.value))}
                                className={styles.select}
                                disabled={!settings.autoRefresh}
                            >
                                <option value={1}>1 Minute</option>
                                <option value={5}>5 Minuten</option>
                                <option value={10}>10 Minuten</option>
                                <option value={30}>30 Minuten</option>
                            </select>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Bell size={14} />
                            Benachrichtigungen
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>Push-Benachrichtigungen</span>
                                <span className={styles.settingDescription}>Bei kritischen Ereignissen</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={e => updateSetting('notifications', e.target.checked)}
                                />
                                <span className={styles.toggleSwitch} />
                            </label>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                {settings.soundEffects ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                <span className={styles.settingLabel}>Sound-Effekte</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.soundEffects}
                                    onChange={e => updateSetting('soundEffects', e.target.checked)}
                                />
                                <span className={styles.toggleSwitch} />
                            </label>
                        </div>
                    </div>

                    {/* Display Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Monitor size={14} />
                            Anzeige
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Globe size={14} />
                                <span className={styles.settingLabel}>Sprache</span>
                            </div>
                            <select
                                value={settings.language}
                                onChange={e => updateSetting('language', e.target.value as 'de' | 'en')}
                                className={styles.select}
                            >
                                <option value="de">Deutsch</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Palette size={14} />
                                <span className={styles.settingLabel}>Standard-Kartenstil</span>
                            </div>
                            <select
                                value={settings.defaultMapStyle}
                                onChange={e => updateSetting('defaultMapStyle', e.target.value as AppSettings['defaultMapStyle'])}
                                className={styles.select}
                            >
                                <option value="dark">Dark</option>
                                <option value="satellite">Satellit</option>
                                <option value="terrain">Terrain</option>
                                <option value="tactical">Taktisch</option>
                            </select>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Map size={14} />
                                <span className={styles.settingLabel}>Willkommens-Screen</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.showWelcomeOnStart}
                                    onChange={e => updateSetting('showWelcomeOnStart', e.target.checked)}
                                />
                                <span className={styles.toggleSwitch} />
                            </label>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button className={styles.resetButton} onClick={resetSettings}>
                        Einstellungen zurücksetzen
                    </button>

                    {/* Version Info */}
                    <div className={styles.versionInfo}>
                        <span>Global Observer v2.1.0</span>
                        <span>Build 2026.01.11</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
