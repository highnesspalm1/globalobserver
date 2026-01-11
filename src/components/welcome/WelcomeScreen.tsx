import React, { useState } from 'react';
import {
  Globe,
  MapPin,
  Shield,
  Layers,
  Clock,
  Filter,
  Download,
  Keyboard,
  ChevronRight,
  X,
  Radio,
  Crosshair,
  Target,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { Button } from '../ui/Button';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onDismiss: () => void;
  onShowAgain?: (show: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss, onShowAgain }) => {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const FEATURES = [
    {
      icon: <MapPin size={24} />,
      title: t.welcome.features.realtime,
      description: t.welcome.features.realtimeDesc,
    },
    {
      icon: <Layers size={24} />,
      title: t.welcome.features.layers,
      description: t.welcome.features.layersDesc,
    },
    {
      icon: <Clock size={24} />,
      title: t.welcome.features.timeline,
      description: t.welcome.features.timelineDesc,
    },
    {
      icon: <Filter size={24} />,
      title: t.welcome.features.filters,
      description: t.welcome.features.filtersDesc,
    },
    {
      icon: <Download size={24} />,
      title: t.welcome.features.export,
      description: t.welcome.features.exportDesc,
    },
    {
      icon: <Keyboard size={24} />,
      title: t.welcome.features.shortcuts,
      description: t.welcome.features.shortcutsDesc,
    },
  ];

  const KEYBOARD_SHORTCUTS = [
    { keys: ['S'], description: t.shortcuts.toggleSidebar },
    { keys: ['L'], description: t.shortcuts.toggleLayers },
    { keys: ['T'], description: t.shortcuts.toggleTimeline },
    { keys: ['F'], description: t.shortcuts.focusSearch },
    { keys: ['Esc'], description: t.shortcuts.clearSelection },
    { keys: ['?'], description: t.shortcuts.showHelp },
  ];

  const handleDismiss = () => {
    if (onShowAgain) {
      onShowAgain(!dontShowAgain);
    }
    onDismiss();
  };

  const totalSteps = 3;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleDismiss} aria-label={t.welcome.close}>
          <X size={20} />
        </button>

        {/* Hero Section */}
        {step === 0 && (
          <div className={styles.heroSection}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoGlow} />
              <div className={styles.logoIcon}>
                <Globe size={48} />
              </div>
            </div>

            <h1 className={styles.title}>
              {t.welcome.welcomeTo}
              <span className={styles.titleAccent}>{t.app.title}</span>
            </h1>

            <p className={styles.subtitle}>
              {t.welcome.description}
            </p>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <Radio className={styles.statIcon} size={20} />
                <span className={styles.statValue}>{t.header.live}</span>
                <span className={styles.statLabel}>{t.welcome.tracking}</span>
              </div>
              <div className={styles.stat}>
                <Crosshair className={styles.statIcon} size={20} />
                <span className={styles.statValue}>{t.welcome.multiLayer}</span>
                <span className={styles.statLabel}>{t.welcome.maps}</span>
              </div>
              <div className={styles.stat}>
                <Target className={styles.statIcon} size={20} />
                <span className={styles.statValue}>{t.events.verified}</span>
                <span className={styles.statLabel}>{t.welcome.data}</span>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {step === 1 && (
          <div className={styles.featuresSection}>
            <h2 className={styles.sectionTitle}>
              <Shield size={24} />
              {t.welcome.powerfulFeatures}
            </h2>

            <div className={styles.featuresGrid}>
              {FEATURES.map((feature, index) => (
                <div 
                  key={index} 
                  className={styles.featureCard}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortcuts Section */}
        {step === 2 && (
          <div className={styles.shortcutsSection}>
            <h2 className={styles.sectionTitle}>
              <Keyboard size={24} />
              {t.shortcuts.title}
            </h2>

            <div className={styles.shortcutsGrid}>
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div key={index} className={styles.shortcutItem}>
                  <div className={styles.shortcutKeys}>
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd key={keyIndex} className={styles.key}>{key}</kbd>
                    ))}
                  </div>
                  <span className={styles.shortcutDescription}>{shortcut.description}</span>
                </div>
              ))}
            </div>

            <div className={styles.dontShowAgain}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{t.welcome.dontShowAgain}</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          <div className={styles.dots}>
            {[...Array(totalSteps)].map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${step === index ? styles.dotActive : ''}`}
                onClick={() => setStep(index)}
                aria-label={`${t.welcome.step} ${index + 1}`}
              />
            ))}
          </div>

          <div className={styles.navButtons}>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                {t.welcome.back}
              </Button>
            )}
            
            {step < totalSteps - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)}>
                {t.welcome.next}
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleDismiss}>
                {t.welcome.getStarted}
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
