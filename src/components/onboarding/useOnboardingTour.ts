const STORAGE_KEY = 'globalobserver-tour-completed';

// Hook to manually trigger tour
export const useOnboardingTour = () => {
  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return { resetTour };
};
