// Audio system using HTML5 Audio elements for iOS compatibility
// Uses custom WAV files for game sounds with multiple copies for rapid playback

let audioInitialized = false;

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
  buzz: '/audio/buzz.wav',
  gameEnd: '/audio/gameEnd.wav',
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

// Initialize audio system - must be called from user gesture
export async function initAudioContext(): Promise<any> {
  if (audioInitialized) {
    console.log('Audio already initialized');
    return { state: 'running' };
  }
  
  createAudioPool();
  
  // Unlock audio on iOS by playing each copy at zero volume (silent unlock)
  const unlockPromises: Promise<void>[] = [];
  
  audioPool.forEach((copies) => {
    copies.forEach(audio => {
      unlockPromises.push(new Promise<void>((resolve) => {
        audio.volume = 0;
        audio.muted = true;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = 1.0;
              audio.muted = false;
              resolve();
            })
            .catch(() => {
              audio.volume = 1.0;
              audio.muted = false;
              resolve();
            });
        } else {
          audio.muted = false;
          resolve();
        }
      }));
    });
  });
  
  await Promise.all(unlockPromises);
  audioInitialized = true;
  console.log('Audio initialized and unlocked');
  return { state: 'running' };
}

export function getAudioContext(): any {
  return audioInitialized ? { state: 'running' } : null;
}

export function isAudioReady(): boolean {
  return audioInitialized;
}

// Play a specific sound by name using round-robin selection of copies
export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'buzz' | 'gameEnd') {
  console.log('playSound:', soundName);
  
  // Ensure audio pool is created (for edge cases like page refresh)
  if (audioPool.size === 0) {
    createAudioPool();
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
    await playSound('buzz');
  } else if (frequency >= 800) {
    await playSound('correct');
  } else {
    await playSound('pass');
  }
}
