import { useState, useEffect } from 'react';

export function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    if (screen.orientation) {
      screen.orientation.addEventListener('change', check);
    }

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', check);
      }
    };
  }, []);

  return isLandscape;
}
