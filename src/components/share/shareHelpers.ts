// Helper function to trigger share from anywhere
export const shareEvent = (eventId: string, eventTitle: string) => {
  window.dispatchEvent(new CustomEvent('shareEvent', {
    detail: { eventId, eventTitle }
  }));
};
