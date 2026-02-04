import { isNative } from './platform';

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

async function nativeHaptic(style: HapticStyle): Promise<boolean> {
  const haptics = window.Capacitor?.Plugins?.Haptics;
  if (!haptics) return false;

  try {
    if (style === 'success' || style === 'warning' || style === 'error') {
      await haptics.notification({ type: style.toUpperCase() });
    } else {
      await haptics.impact({ style: style.toUpperCase() });
    }
    return true;
  } catch {
    return false;
  }
}

function webVibrate(pattern: number | number[]): boolean {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function hapticFeedback(style: HapticStyle = 'medium'): Promise<void> {
  if (isNative()) {
    await nativeHaptic(style);
    return;
  }

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 30,
    medium: 50,
    heavy: 80,
    success: 80,
    warning: [40, 30, 40],
    error: [50, 40, 50],
  };

  webVibrate(patterns[style]);
}

export async function hapticCorrect(): Promise<void> {
  await hapticFeedback('success');
}

export async function hapticPass(): Promise<void> {
  await hapticFeedback('warning');
}

export async function hapticTick(): Promise<void> {
  await hapticFeedback('light');
}
