// Audio system using HTML5 Audio elements for iOS compatibility
// Uses custom WAV files for game sounds with multiple copies for rapid playback

let audioInitialized = false;
let audioUnlocked = false;
let unlockPromise: Promise<void> | null = null; // Track in-progress unlock

// Web Audio API context for silent unlock
let webAudioContext: AudioContext | null = null;

// Pool of audio elements - multiple copies per sound for rapid successive plays
let audioPool: Map<string, HTMLAudioElement[]> = new Map();
let audioIndex: Map<string, number> = new Map();

// Number of copies per sound (allows rapid successive plays)
const COPIES_PER_SOUND = 3;

// Custom WAV files in public/audio folder
const AUDIO_FILES: Record<string, string> = {
  correct: '/audio/correct.wav',
  pass: '/audio/pass.wav',
  tick: '/audio/tick.wav',
  tock: '/audio/tock.wav',
  roundEnd: '/audio/roundEnd.wav',
  gameEnd: '/audio/gameEnd.wav',
  applause: '/audio/applause.wav',
  drumroll: '/audio/drumroll.wav',
  countdown: '/audio/countdown.wav',
};

// Pre-create multiple audio elements for each sound
function createAudioPool() {
  if (audioPool.size > 0) return;
  
  Object.entries(AUDIO_FILES).forEach(([name, path]) => {
    const copies: HTMLAudioElement[] = [];
    for (let i = 0; i < COPIES_PER_SOUND; i++) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 1.0;
      copies.push(audio);
    }
    audioPool.set(name, copies);
    audioIndex.set(name, 0);
  });
  console.log('Audio pool created with', audioPool.size, 'sounds,', COPIES_PER_SOUND, 'copies each');
}

// Minimal silent WAV as base64 data URI (44 bytes header + 2 bytes of silence)
const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Silently unlock iOS audio using Web Audio API AND HTML Audio
// Must be called from a user gesture (tap/click)
function unlockAudioSilently(): Promise<void> {
  // Already unlocked
  if (audioUnlocked) return Promise.resolve();
  
  // Already unlocking - return existing promise
  if (unlockPromise) return unlockPromise;
  
  console.log('Starting silent audio unlock...');
  
  const promises: Promise<void>[] = [];
  
  // Step 1: Unlock Web Audio API
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    if (!webAudioContext) {
      webAudioContext = new AudioContextClass();
    }
    
    // Resume context if suspended (MUST be called synchronously during gesture)
    if (webAudioContext.state === 'suspended') {
      promises.push(
        webAudioContext.resume()
          .then(() => console.log('Web Audio context resumed'))
          .catch((e) => console.log('Web Audio resume failed:', e))
      );
    }
    
    // Create and play a tiny silent buffer SYNCHRONOUSLY
    try {
      const buffer = webAudioContext.createBuffer(1, 1, 22050);
      const source = webAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(webAudioContext.destination);
      source.start(0);
      console.log('Silent Web Audio buffer played');
    } catch (e) {
      console.log('Silent buffer play failed:', e);
    }
  }
  
  // Step 2: Unlock HTML Audio by playing a silent WAV data URI
  // This is a truly silent audio file, not our game sounds
  const silentAudio = new Audio(SILENT_WAV_DATA_URI);
  silentAudio.volume = 1; // Full volume is fine - it's silent
  
  const htmlAudioPromise = silentAudio.play()
    .then(() => {
      silentAudio.pause();
      console.log('Silent HTML Audio played - HTML Audio unlocked');
    })
    .catch((e) => {
      console.log('Silent HTML Audio play failed:', e);
    });
  promises.push(htmlAudioPromise);
  
  // Wait for all unlocks to complete
  unlockPromise = Promise.all(promises)
    .then(() => {
      audioUnlocked = true;
      console.log('Audio unlock complete');
    })
    .catch((e) => {
      console.log('Audio unlock failed:', e);
      audioUnlocked = true; // Mark as unlocked anyway to avoid blocking
    });
  
  return unlockPromise;
}

// Initialize audio system - must be called from user gesture
// This is the sync version for backwards compatibility
export function initAudioContext(): { state: string } {
  // Already fully initialized - return immediately
  if (audioInitialized && audioUnlocked) {
    return { state: 'running' };
  }
  
  // If pool is empty, we need to reinitialize (handles hot reload case)
  if (audioPool.size === 0) {
    audioInitialized = false;
    audioUnlocked = false;
    unlockPromise = null;
  }
  
  // Create pool if needed
  createAudioPool();
  
  // Silently unlock audio for iOS (fires in parallel, doesn't block)
  unlockAudioSilently();
  
  audioInitialized = true;
  return { state: 'running' };
}

// Async version that waits for unlock to complete before returning
// Use this when you need to ensure audio is ready before navigation
export async function initAudioContextAsync(): Promise<{ state: string }> {
  // Already fully initialized - return immediately
  if (audioInitialized && audioUnlocked) {
    return { state: 'running' };
  }
  
  // If pool is empty, we need to reinitialize (handles hot reload case)
  if (audioPool.size === 0) {
    audioInitialized = false;
    audioUnlocked = false;
    unlockPromise = null;
  }
  
  // Create pool if needed
  createAudioPool();
  
  // Silently unlock audio for iOS and WAIT for completion
  await unlockAudioSilently();
  
  audioInitialized = true;
  return { state: 'running' };
}

export function getAudioContext(): any {
  return audioInitialized ? { state: 'running' } : null;
}

export function isAudioReady(): boolean {
  return audioInitialized && audioUnlocked;
}

// Stop a specific sound (useful for drumroll which needs to be stoppable)
export function stopSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'roundEnd' | 'gameEnd' | 'applause' | 'drumroll' | 'countdown') {
  const copies = audioPool.get(soundName);
  if (!copies) return;
  
  copies.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  console.log('stopSound:', soundName);
}

// Play a specific sound by name using round-robin selection of copies
export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'roundEnd' | 'gameEnd' | 'applause' | 'drumroll' | 'countdown') {
  console.log('playSound:', soundName);
  
  // Ensure audio pool is created (for edge cases like page refresh)
  if (audioPool.size === 0) {
    createAudioPool();
    console.log('Warning: Audio pool created lazily, may not play on iOS');
  }
  
  // Wait for unlock to complete if in progress
  if (unlockPromise && !audioUnlocked) {
    console.log('Waiting for audio unlock...');
    await unlockPromise;
  }
  
  const copies = audioPool.get(soundName);
  if (!copies || copies.length === 0) {
    console.log('No pooled audio for:', soundName);
    return;
  }
  
  // Get current index and advance to next copy (round-robin)
  const currentIndex = audioIndex.get(soundName) || 0;
  const nextIndex = (currentIndex + 1) % copies.length;
  audioIndex.set(soundName, nextIndex);
  
  const audio = copies[currentIndex];
  
  try {
    audio.currentTime = 0;
    audio.volume = 1.0;
    await audio.play();
    console.log('playSound success:', soundName, 'copy', currentIndex);
  } catch (e) {
    console.log('playSound failed:', soundName, e);
  }
}

// Legacy playBeep function for compatibility
export async function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  if (frequency === 1200) {
    await playSound('tick');
  } else if (frequency === 800) {
    await playSound('tock');
  } else if (frequency === 200) {
    await playSound('roundEnd');
  } else if (frequency >= 800) {
    await playSound('correct');
  } else {
    await playSound('pass');
  }
}
