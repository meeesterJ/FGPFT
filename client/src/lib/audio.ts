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
// Elements are created MUTED to ensure silent unlock
function createAudioPool() {
  if (audioPool.size > 0) return;
  
  Object.entries(AUDIO_FILES).forEach(([name, path]) => {
    const copies: HTMLAudioElement[] = [];
    for (let i = 0; i < COPIES_PER_SOUND; i++) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 1.0;
      audio.muted = true; // Start muted for silent unlock
      copies.push(audio);
    }
    audioPool.set(name, copies);
    audioIndex.set(name, 0);
  });
  console.log('Audio pool created with', audioPool.size, 'sounds,', COPIES_PER_SOUND, 'copies each');
}

// Silently unlock iOS audio by playing/pausing muted audio elements
// Elements were created muted, so playing them is silent
// Must be called from a user gesture (tap/click)
// Returns a promise that resolves when all audio is unlocked
function unlockAudioSilently(): Promise<void> {
  // Already unlocked
  if (audioUnlocked) return Promise.resolve();
  
  // Already unlocking - return existing promise
  if (unlockPromise) return unlockPromise;
  
  unlockPromise = (async () => {
    try {
      // Step 1: Create and resume Web Audio context with silent buffer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!webAudioContext) {
          webAudioContext = new AudioContextClass();
        }
        
        // Resume the context (required for iOS after user gesture)
        if (webAudioContext.state === 'suspended') {
          try {
            await webAudioContext.resume();
          } catch (e) {
            console.log('Web Audio resume failed:', e);
          }
        }
        
        // Create and play a tiny silent buffer (1 sample of silence)
        try {
          const buffer = webAudioContext.createBuffer(1, 1, 22050);
          const source = webAudioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(webAudioContext.destination);
          source.start(0);
        } catch (e) {
          console.log('Web Audio buffer play failed:', e);
        }
      }
      
      // Step 2: Play/pause each pooled audio element (they're already muted from creation)
      // Wait for all unlocks to complete before marking as unlocked
      const unlockPromises: Promise<void>[] = [];
      
      audioPool.forEach((copies) => {
        copies.forEach(audio => {
          // Elements are already muted from createAudioPool()
          const promise = new Promise<void>((resolve) => {
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.then === 'function') {
              playPromise
                .then(() => {
                  audio.pause();
                  audio.currentTime = 0;
                  audio.muted = false; // Unmute for future plays
                  resolve();
                })
                .catch((e) => {
                  console.log('Audio unlock play failed:', e);
                  audio.muted = false; // Unmute even on failure
                  resolve(); // Resolve anyway so we don't block forever
                });
            } else {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
              resolve();
            }
          });
          unlockPromises.push(promise);
        });
      });
      
      // Wait for all audio elements to be unlocked
      await Promise.all(unlockPromises);
      audioUnlocked = true;
      console.log('Audio unlock complete');
    } catch (e) {
      console.log('Audio unlock failed:', e);
      audioUnlocked = true; // Mark as unlocked anyway to avoid blocking
    }
  })();
  
  return unlockPromise;
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
    unlockPromise = null;
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
