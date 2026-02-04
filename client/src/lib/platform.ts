declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      Plugins?: {
        Haptics?: {
          impact: (options: { style: string }) => Promise<void>;
          notification: (options: { type: string }) => Promise<void>;
          vibrate: () => Promise<void>;
        };
      };
    };
  }
}

export type Platform = 'web' | 'ios' | 'android';

export function isNative(): boolean {
  return typeof window !== 'undefined' && 
         window.Capacitor?.isNativePlatform?.() === true;
}

export function getPlatform(): Platform {
  if (!isNative()) return 'web';
  
  const platform = window.Capacitor?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

export function isIOS(): boolean {
  if (isNative()) {
    return getPlatform() === 'ios';
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  if (isNative()) {
    return getPlatform() === 'android';
  }
  return /Android/.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}
