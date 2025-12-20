// Audio system using HTML5 Audio elements for iOS compatibility
// Uses custom WAV files for game sounds

let audioInitialized = false;
let audioPool: Map<string, HTMLAudioElement> = new Map();

// Custom WAV files in public/audio folder
const AUDIO_FILES: Record<string, string> = {
  correct: '/audio/correct.wav',
  pass: '/audio/pass.wav',
  tick: '/audio/tick.wav',
  tock: '/audio/tock.wav',
  buzz: '/audio/buzz.wav',
  gameEnd: '/audio/gameEnd.wav',
};

// Pre-create audio elements for each sound
function createAudioPool() {
  if (audioPool.size > 0) return;
  
  Object.entries(AUDIO_FILES).forEach(([name, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioPool.set(name, audio);
  });
  console.log('Audio pool created with', audioPool.size, 'sounds');
}

// Initialize audio system - must be called from user gesture
export async function initAudioContext(): Promise<any> {
  if (audioInitialized) {
    console.log('Audio already initialized');
    return { state: 'running' };
  }
  
  createAudioPool();
  
  // Unlock audio on iOS by playing each at zero volume (silent unlock)
  const unlockPromises = Array.from(audioPool.values()).map(audio => {
    return new Promise<void>((resolve) => {
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

// Play a specific sound by name
export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'buzz' | 'gameEnd') {
  console.log('playSound:', soundName);
  
  const audio = audioPool.get(soundName);
  if (!audio) {
    console.log('No pooled audio for:', soundName);
    return;
  }
  
  try {
    audio.currentTime = 0;
    audio.volume = 1.0;
    await audio.play();
    console.log('playSound success:', soundName);
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
