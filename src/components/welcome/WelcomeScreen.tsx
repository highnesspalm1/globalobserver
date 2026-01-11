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
import { Button } from '../ui/Button';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onDismiss: () => void;
  onShowAgain?: (show: boolean) => void;
}

const FEATURES = [
  {
    icon: <MapPin size={24} />,
    title: 'Echtzeit-Events',
    description: 'Verfolgen Sie Ereignisse in Echtzeit auf der interaktiven Karte',
  },
  {
    icon: <Layers size={24} />,
    title: 'Multiple Layer',
    description: 'Schalten Sie zwischen Satelliten-, Terrain- und taktischen Ansichten',
  },
  {
    icon: <Clock size={24} />,
    title: 'Zeit-Navigation',
    description: 'Reisen Sie durch die Zeit mit dem interaktiven Timeline-Slider',
  },
  {
    icon: <Filter size={24} />,
    title: 'Erweiterte Filter',
    description: 'Filtern Sie nach Kategorie, Schweregrad und Verifizierungsstatus',
  },
  {
    icon: <Download size={24} />,
    title: 'Export-Optionen',
    description: 'Exportieren Sie Daten als GeoJSON, CSV oder KML',
  },
  {
    icon: <Keyboard size={24} />,
    title: 'Tastaturkürzel',
    description: 'Nutzen Sie Shortcuts für schnelle Navigation',
  },
];

const KEYBOARD_SHORTCUTS = [
  { keys: ['S'], description: 'Sidebar ein/aus' },
  { keys: ['L'], description: 'Layer-Panel ein/aus' },
  { keys: ['T'], description: 'Timeline ein/aus' },
  { keys: ['F'], description: 'Suche fokussieren' },
  { keys: ['Esc'], description: 'Auswahl aufheben' },
  { keys: ['?'], description: 'Hilfe anzeigen' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDismiss, onShowAgain }) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
        <button className={styles.closeButton} onClick={handleDismiss} aria-label="Schließen">
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
              Willkommen bei
              <span className={styles.titleAccent}>Global Observer</span>
            </h1>

            <p className={styles.subtitle}>
              Ihre Plattform für Geo-Intelligence und Echtzeit-Ereignisüberwachung
            </p>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <Radio className={styles.statIcon} size={20} />
                <span className={styles.statValue}>Live</span>
                <span className={styles.statLabel}>Tracking</span>
              </div>
              <div className={styles.stat}>
                <Crosshair className={styles.statIcon} size={20} />
                <span className={styles.statValue}>Multi-Layer</span>
                <span className={styles.statLabel}>Karten</span>
              </div>
              <div className={styles.stat}>
                <Target className={styles.statIcon} size={20} />
                <span className={styles.statValue}>Verifiziert</span>
                <span className={styles.statLabel}>Daten</span>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {step === 1 && (
          <div className={styles.featuresSection}>
            <h2 className={styles.sectionTitle}>
              <Shield size={24} />
              Leistungsstarke Funktionen
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
              Tastaturkürzel
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
                <span className={styles.checkboxText}>Nicht mehr anzeigen</span>
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
                aria-label={`Schritt ${index + 1}`}
              />
            ))}
          </div>

          <div className={styles.navButtons}>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Zurück
              </Button>
            )}
            
            {step < totalSteps - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)}>
                Weiter
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleDismiss}>
                Los geht's
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
