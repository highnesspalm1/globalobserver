import { useRef, useEffect, useCallback } from 'react';

interface SwipeConfig {
  threshold?: number;
  preventScroll?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

export const useSwipeGestures = <T extends HTMLElement>(
  config: SwipeConfig = {}
) => {
  const {
    threshold = 50,
    preventScroll = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const ref = useRef<T>(null);
  const swipeState = useRef<SwipeState | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.current || !preventScroll) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;
    
    // Prevent scroll if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;
    const deltaTime = Date.now() - swipeState.current.startTime;

    // Only register swipes that are fast enough (< 500ms)
    if (deltaTime > 500) {
      swipeState.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    swipeState.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  return ref;
};

// Edge swipe detection hook
export const useEdgeSwipe = (config: {
  edge: 'left' | 'right';
  edgeWidth?: number;
  threshold?: number;
  onSwipe: () => void;
}) => {
  const { edge, edgeWidth = 20, threshold = 50, onSwipe } = config;
  const swipeState = useRef<SwipeState | null>(null);
  const startedFromEdge = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;
      
      const isLeftEdge = edge === 'left' && touch.clientX < edgeWidth;
      const isRightEdge = edge === 'right' && touch.clientX > windowWidth - edgeWidth;
      
      if (isLeftEdge || isRightEdge) {
        startedFromEdge.current = true;
        swipeState.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!swipeState.current || !startedFromEdge.current) {
        startedFromEdge.current = false;
        swipeState.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeState.current.startX;
      const deltaTime = Date.now() - swipeState.current.startTime;

      if (deltaTime < 500 && Math.abs(deltaX) > threshold) {
        if ((edge === 'left' && deltaX > 0) || (edge === 'right' && deltaX < 0)) {
          onSwipe();
        }
      }

      startedFromEdge.current = false;
      swipeState.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [edge, edgeWidth, threshold, onSwipe]);
};

export default useSwipeGestures;
