import React, { useState, useCallback } from 'react';
import {
    Settings,
    X,
    Clock,
    Bell,
    Map,
    Palette,
    Volume2,
    VolumeX,
    RefreshCw,
    Monitor
} from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { useI18n, LANGUAGES } from '../../i18n';
import type { Language } from '../../i18n';
import styles from './SettingsPanel.module.css';

interface AppSettings {
    autoRefresh: boolean;
    refreshInterval: number;
    notifications: boolean;
    soundEffects: boolean;
    defaultMapStyle: 'dark' | 'satellite' | 'terrain' | 'tactical';
    showWelcomeOnStart: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    autoRefresh: true,
    refreshInterval: 5,
    notifications: true,
    soundEffects: false,
    defaultMapStyle: 'dark',
    showWelcomeOnStart: true
};

const SettingsPanel: React.FC = () => {
    const { t, language, setLanguage } = useI18n();
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
                title={t.settings.title}
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
                        <span>{t.settings.title}</span>
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
                            {t.settings.autoRefresh}
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>{t.settings.autoRefresh}</span>
                                <span className={styles.settingDescription}>{t.settings.autoRefreshDesc}</span>
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
                                <span className={styles.settingLabel}>{t.settings.refreshInterval}</span>
                            </div>
                            <select
                                value={settings.refreshInterval}
                                onChange={e => updateSetting('refreshInterval', Number(e.target.value))}
                                className={styles.select}
                                disabled={!settings.autoRefresh}
                            >
                                <option value={1}>1 {t.time.minute}</option>
                                <option value={5}>5 {t.time.minutes}</option>
                                <option value={10}>10 {t.time.minutes}</option>
                                <option value={30}>30 {t.time.minutes}</option>
                            </select>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Bell size={14} />
                            {t.notifications.title}
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>{t.settings.pushNotifications}</span>
                                <span className={styles.settingDescription}>{t.settings.pushNotificationsDesc}</span>
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
                                <span className={styles.settingLabel}>{t.settings.soundEffects}</span>
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
                            {t.settings.display}
                        </h3>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <span className={styles.settingLabel}>{t.settings.language}</span>
                            </div>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as Language)}
                                className={styles.select}
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.nativeName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Palette size={14} />
                                <span className={styles.settingLabel}>{t.settings.defaultMapStyle}</span>
                            </div>
                            <select
                                value={settings.defaultMapStyle}
                                onChange={e => updateSetting('defaultMapStyle', e.target.value as AppSettings['defaultMapStyle'])}
                                className={styles.select}
                            >
                                <option value="dark">{t.layers.styles.dark}</option>
                                <option value="satellite">{t.layers.styles.satellite}</option>
                                <option value="terrain">{t.layers.styles.terrain}</option>
                                <option value="tactical">{t.layers.styles.tactical}</option>
                            </select>
                        </div>

                        <div className={styles.settingRow}>
                            <div className={styles.settingInfo}>
                                <Map size={14} />
                                <span className={styles.settingLabel}>{t.settings.showWelcome}</span>
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
                        {t.settings.reset}
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
