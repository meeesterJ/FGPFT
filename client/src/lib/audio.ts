// Global audio context for game sounds
let audioContext: AudioContext | null = null;
let initPromise: Promise<void> | null = null;
let audioUnlocked = false;

// iOS requires playing an actual audio element to unlock audio output
// This creates a tiny silent audio and plays it on user gesture
function unlockAudioForIOS(): Promise<void> {
  if (audioUnlocked) return Promise.resolve();
  
  return new Promise((resolve) => {
    // Create a silent audio element with a tiny data URI
    // This is a 0.1 second silent WAV file encoded as base64
    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silentAudio.volume = 0.01;
    
    const playPromise = silentAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('iOS audio unlocked via silent audio element');
          audioUnlocked = true;
          resolve();
        })
        .catch((e) => {
          console.log('iOS audio unlock failed:', e);
          // Still mark as attempted to avoid repeated failures
          audioUnlocked = true;
          resolve();
        });
    } else {
      audioUnlocked = true;
      resolve();
    }
  });
}

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
      // First, unlock iOS audio by playing a silent audio element
      await unlockAudioForIOS();
      
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext created, state:', audioContext.state);
      }
      
      if (audioContext.state === 'suspended') {
        console.log('AudioContext suspended, attempting resume...');
        await audioContext.resume();
        console.log('AudioContext after resume, state:', audioContext.state);
      }
    } catch (e) {
      console.log('AudioContext init failed:', e);
    }
  })();
  
  await initPromise;
  initPromise = null;
  console.log('initAudioContext complete, final state:', audioContext?.state);
  return audioContext;
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function isAudioReady(): boolean {
  return audioContext !== null && audioContext.state === 'running';
}

export async function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = audioContext;
  
  // If context doesn't exist or is closed, we can't play
  if (!ctx) {
    console.log('playBeep: No audio context exists');
    return;
  }
  
  // If suspended, try to resume (will only work from user gesture)
  if (ctx.state === 'suspended') {
    console.log('playBeep: Context suspended, trying resume...');
    try {
      await ctx.resume();
      console.log('playBeep: Resume result, state:', ctx.state);
    } catch (e) {
      console.log('playBeep: Resume failed:', e);
    }
  }
  
  if (ctx.state !== 'running') {
    console.log('playBeep: Context not running, state:', ctx.state);
    return;
  }
  
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    // Ensure minimum duration for audibility
    const actualDuration = Math.max(duration, 100) / 1000;
    
    // Higher initial gain for better audibility
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + actualDuration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + actualDuration);
    
    console.log('sharedPlayBeep: Sound played!', { frequency, duration: actualDuration * 1000, type });
  } catch (e) {
    console.log('Audio playback failed:', e);
  }
}
