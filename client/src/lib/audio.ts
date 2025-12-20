// Global audio context for game sounds
let audioContext: AudioContext | null = null;
let initPromise: Promise<void> | null = null;

export async function initAudioContext(): Promise<AudioContext | null> {
  // If already running, return immediately
  if (audioContext && audioContext.state === 'running') {
    return audioContext;
  }
  
  // If init is already in progress, wait for it
  if (initPromise) {
    await initPromise;
    return audioContext;
  }
  
  // Create the init promise
  initPromise = (async () => {
    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    } catch (e) {
      console.log('AudioContext init failed:', e);
    }
  })();
  
  await initPromise;
  initPromise = null;
  return audioContext;
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function isAudioReady(): boolean {
  return audioContext !== null && audioContext.state === 'running';
}

export function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = audioContext;
  
  // If context isn't running, try to resume (may work if called from user gesture)
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  
  // Only play if context is running
  if (!ctx || ctx.state !== 'running') {
    return;
  }
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) {
    // Audio playback failed
  }
}
