import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface SwipeBackOptions {
  targetPath: string;
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeBack({ targetPath, threshold = 100, edgeWidth = 40 }: SwipeBackOptions) {
  const [, setLocation] = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const startX = e.touches[0].clientX;
      if (startX <= edgeWidth) {
        touchStartX.current = startX;
        touchStartY.current = e.touches[0].clientY;
        isEdgeSwipe.current = true;
      } else {
        isEdgeSwipe.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe.current || touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);

      if (deltaX > threshold && deltaY < 80) {
        setLocation(targetPath);
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isEdgeSwipe.current = false;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [targetPath, threshold, edgeWidth, setLocation]);
}
