import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronRight, ChevronLeft, MapPin, Layers, Clock, 
  Search, Bell, Bookmark, Share2, Filter, Zap, Globe
} from 'lucide-react';
import styles from './OnboardingTour.module.css';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for highlighting
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Global Observer',
    description: 'Ihre Echtzeit-Plattform für globale Konflikte und Ereignisse. Diese kurze Tour zeigt Ihnen die wichtigsten Funktionen.',
    icon: <Globe size={32} />,
    position: 'center',
  },
  {
    id: 'map',
    title: 'Interaktive Weltkarte',
    description: 'Die Karte zeigt alle aktuellen Ereignisse. Zoomen Sie hinein, um Details zu sehen. Klicken Sie auf Marker für mehr Informationen.',
    icon: <MapPin size={32} />,
    position: 'center',
  },
  {
    id: 'sidebar',
    title: 'Event-Liste',
    description: 'Links finden Sie alle Ereignisse als Liste. Filtern Sie nach Kategorie, Schweregrad oder Suchbegriff.',
    icon: <Filter size={32} />,
    target: '.sidebar',
    position: 'right',
  },
  {
    id: 'layers',
    title: 'Kartenebenen',
    description: 'Wechseln Sie zwischen verschiedenen Kartenstilen und aktivieren Sie Heatmaps, Territorien oder 3D-Ansicht.',
    icon: <Layers size={32} />,
    position: 'left',
  },
  {
    id: 'timeline',
    title: 'Zeitregler',
    description: 'Reisen Sie in der Zeit zurück! Der Slider unten lässt Sie vergangene Ereignisse erkunden.',
    icon: <Clock size={32} />,
    position: 'top',
  },
  {
    id: 'search',
    title: 'Schnellsuche',
    description: 'Drücken Sie "/" oder nutzen Sie die Suchleiste, um Orte, Events oder Regionen zu finden.',
    icon: <Search size={32} />,
    position: 'center',
  },
  {
    id: 'notifications',
    title: 'Push-Benachrichtigungen',
    description: 'Aktivieren Sie Alarme für kritische Ereignisse in ausgewählten Regionen.',
    icon: <Bell size={32} />,
    position: 'left',
  },
  {
    id: 'bookmarks',
    title: 'Lesezeichen',
    description: 'Speichern Sie wichtige Orte oder Events für schnellen Zugriff.',
    icon: <Bookmark size={32} />,
    position: 'left',
  },
  {
    id: 'share',
    title: 'Teilen',
    description: 'Teilen Sie interessante Events oder Kartenansichten mit anderen.',
    icon: <Share2 size={32} />,
    position: 'center',
  },
  {
    id: 'shortcuts',
    title: 'Tastenkürzel',
    description: 'Drücken Sie "?" jederzeit, um alle verfügbaren Tastenkürzel anzuzeigen. Viel Erfolg!',
    icon: <Zap size={32} />,
    position: 'center',
  },
];

const STORAGE_KEY = 'globalobserver-tour-completed';

export const OnboardingTour: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if tour was completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowPrompt(false);
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback((markComplete = true) => {
    setIsActive(false);
    setShowPrompt(false);
    if (markComplete) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    endTour(true);
  }, [endTour]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endTour(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, endTour]);

  // Initial prompt
  if (showPrompt && !isActive) {
    return (
      <div className={styles.promptOverlay}>
        <div className={styles.promptCard}>
          <div className={styles.promptIcon}>
            <Globe size={48} />
          </div>
          <h2>Willkommen!</h2>
          <p>Möchten Sie eine kurze Einführung in Global Observer?</p>
          <div className={styles.promptButtons}>
            <button className={styles.primaryButton} onClick={startTour}>
              Tour starten
            </button>
            <button className={styles.secondaryButton} onClick={() => endTour(true)}>
              Überspringen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={styles.overlay}>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={() => endTour(false)} />

      {/* Tour Card */}
      <div className={`${styles.tourCard} ${styles[`position${step.position.charAt(0).toUpperCase() + step.position.slice(1)}`]}`}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={skipTour}>
          <X size={18} />
        </button>

        {/* Step icon */}
        <div className={styles.stepIcon}>
          {step.icon}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.description}>{step.description}</p>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`${styles.progressDot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            className={styles.skipButton}
            onClick={skipTour}
          >
            Überspringen
          </button>

          <div className={styles.navButtons}>
            {!isFirstStep && (
              <button className={styles.navButton} onClick={prevStep}>
                <ChevronLeft size={18} />
                Zurück
              </button>
            )}
            <button className={styles.navButtonPrimary} onClick={nextStep}>
              {isLastStep ? 'Fertig' : 'Weiter'}
              {!isLastStep && <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className={styles.stepCounter}>
          {currentStep + 1} / {TOUR_STEPS.length}
        </div>
      </div>
    </div>
  );
};

// Hook to manually trigger tour
export const useOnboardingTour = () => {
  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return { resetTour };
};

export default OnboardingTour;
