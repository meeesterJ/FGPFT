import { isNative } from './platform';

function getStatusBarPlugin(): any | null {
  try {
    return window.Capacitor?.Plugins?.StatusBar ?? null;
  } catch {
    return null;
  }
}

export async function hideStatusBar(): Promise<void> {
  if (!isNative()) return;

  const plugin = getStatusBarPlugin();
  if (plugin) {
    try {
      await plugin.hide();
    } catch {
    }
  }
}

export async function showStatusBar(): Promise<void> {
  if (!isNative()) return;

  const plugin = getStatusBarPlugin();
  if (plugin) {
    try {
      await plugin.show();
    } catch {
    }
  }
}

export async function setStatusBarDark(): Promise<void> {
  if (!isNative()) return;

  const plugin = getStatusBarPlugin();
  if (plugin) {
    try {
      await plugin.setStyle({ style: 'DARK' });
      await plugin.setBackgroundColor({ color: '#000000' });
    } catch {
    }
  }
}
