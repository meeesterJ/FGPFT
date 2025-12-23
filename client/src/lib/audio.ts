// Audio system using HTML5 Audio elements for iOS compatibility
// Uses custom WAV files for game sounds with multiple copies for rapid playback

let audioInitialized = false;
let audioUnlocked = false;

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

// Silently unlock all audio elements for iOS - fires in parallel, doesn't wait
// Must be called from a user gesture (tap/click)
function unlockAudioSilently(): void {
  if (audioUnlocked) return;
  
  // Fire play/pause on all audio elements simultaneously with volume 0
  // This primes iOS to allow future audio playback
  audioPool.forEach((copies) => {
    copies.forEach(audio => {
      const originalVolume = audio.volume;
      audio.volume = 0;
      audio.muted = true;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = originalVolume;
            audio.muted = false;
          })
          .catch(() => {
            audio.volume = originalVolume;
            audio.muted = false;
          });
      } else {
        // Older browsers where play() returns void - restore immediately
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
        audio.muted = false;
      }
    });
  });
  
  audioUnlocked = true;
}

// Initialize audio system - must be called from user gesture
export function initAudioContext(): { state: string } {
  // Already fully initialized - return immediately
  if (audioInitialized && audioUnlocked) {
    return { state: 'running' };
  }
  
  // If pool is empty, we need to reinitialize (handles hot reload case)
  if (audioPool.size === 0) {
    audioInitialized = false;
    audioUnlocked = false;
  }
  
  // Create pool if needed
  createAudioPool();
  
  // Silently unlock audio for iOS (fires in parallel, doesn't block)
  unlockAudioSilently();
  
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
    // Note: These won't be unlocked, but we try anyway
    console.log('Warning: Audio pool created lazily, may not play on iOS');
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
