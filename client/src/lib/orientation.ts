import { isNative, isIOS } from './platform';

export type OrientationType = 'portrait' | 'landscape-primary' | 'landscape-secondary' | 'unknown';

export interface OrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export type OrientationHandler = (data: OrientationData) => void;

let permissionGranted = false;
let activeHandler: OrientationHandler | null = null;
let storePermissionSync: ((granted: boolean) => void) | null = null;

export function initOrientationSync(syncFn: (granted: boolean) => void): void {
  storePermissionSync = syncFn;
}

export function syncPermissionFromStore(granted: boolean): void {
  permissionGranted = granted;
}

export function isOrientationSupported(): boolean {
  return typeof DeviceOrientationEvent !== 'undefined';
}

export function needsPermissionRequest(): boolean {
  if (isNative()) return false;
  
  return isIOS() && 
         typeof DeviceOrientationEvent !== 'undefined' &&
         typeof (DeviceOrientationEvent as any).requestPermission === 'function';
}

export async function requestOrientationPermission(): Promise<boolean> {
  if (isNative()) {
    permissionGranted = true;
    storePermissionSync?.(true);
    return true;
  }

  if (!needsPermissionRequest()) {
    permissionGranted = true;
    storePermissionSync?.(true);
    return true;
  }

  try {
    const permission = await (DeviceOrientationEvent as any).requestPermission();
    permissionGranted = permission === 'granted';
    if (permissionGranted) {
      storePermissionSync?.(true);
    }
    return permissionGranted;
  } catch (e) {
    console.warn('Orientation permission request failed:', e);
    return false;
  }
}

export function hasOrientationPermission(): boolean {
  return permissionGranted;
}

export function startOrientationTracking(handler: OrientationHandler): () => void {
  activeHandler = handler;

  const webHandler = (event: DeviceOrientationEvent) => {
    handler({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  };

  window.addEventListener('deviceorientation', webHandler);

  return () => {
    activeHandler = null;
    window.removeEventListener('deviceorientation', webHandler);
  };
}

export function getScreenOrientation(): OrientationType {
  if (typeof screen !== 'undefined' && screen.orientation) {
    const type = screen.orientation.type;
    if (type.includes('portrait')) return 'portrait';
    if (type === 'landscape-primary') return 'landscape-primary';
    if (type === 'landscape-secondary') return 'landscape-secondary';
  }
  
  if (typeof window !== 'undefined') {
    const angle = (window as any).orientation;
    if (angle === 0 || angle === 180) return 'portrait';
    if (angle === 90) return 'landscape-primary';
    if (angle === -90) return 'landscape-secondary';
  }
  
  return 'unknown';
}

export function isLandscape(): boolean {
  const orientation = getScreenOrientation();
  return orientation === 'landscape-primary' || orientation === 'landscape-secondary';
}

function getScreenOrientationPlugin(): any | null {
  try {
    return window.Capacitor?.Plugins?.ScreenOrientation ?? null;
  } catch {
    return null;
  }
}

export async function lockToLandscape(): Promise<boolean> {
  if (isNative()) {
    const plugin = getScreenOrientationPlugin();
    if (plugin) {
      try {
        await plugin.lock({ orientation: 'landscape' });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    if (screen.orientation && (screen.orientation as any).lock) {
      await (screen.orientation as any).lock('landscape-primary');
      return true;
    }
  } catch {
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
        return true;
      }
    } catch {
      // iOS Safari doesn't support screen.orientation.lock — silently fail
    }
  }
  return false;
}

export async function unlockOrientation(): Promise<void> {
  if (isNative()) {
    const plugin = getScreenOrientationPlugin();
    if (plugin) {
      try {
        await plugin.unlock();
      } catch {
        // Silently fail
      }
    }
    return;
  }

  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch {
    // Silently fail
  }
}
