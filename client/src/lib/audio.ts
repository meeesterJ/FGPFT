import { isNative } from './platform';

let audioInitialized = false;
let audioUnlocked = false;
let unlockPromise: Promise<void> | null = null;
let webAudioContext: AudioContext | null = null;
let audioPool: Map<string, HTMLAudioElement[]> = new Map();
let audioIndex: Map<string, number> = new Map();

const COPIES_PER_SOUND = 3;

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
}

function unlockAudioSilently(): Promise<void> {
  if (audioUnlocked) return Promise.resolve();
  if (unlockPromise) return unlockPromise;
  
  if (isNative()) {
    audioUnlocked = true;
    return Promise.resolve();
  }
  
  const promises: Promise<void>[] = [];
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    if (!webAudioContext) {
      webAudioContext = new AudioContextClass();
    }
    
    if (webAudioContext.state === 'suspended') {
      promises.push(
        webAudioContext.resume()
          .then(() => console.log('Web Audio context resumed'))
          .catch((e) => console.warn('Web Audio resume failed:', e))
      );
    }
    
    try {
      const buffer = webAudioContext.createBuffer(1, 4410, 44100);
      const source = webAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(webAudioContext.destination);
      source.start(0);
    } catch (e) {
      console.warn('Silent buffer play failed:', e);
    }
  }
  
  const firstSound = audioPool.get('tick');
  if (firstSound && firstSound[0]) {
    const audio = firstSound[0];
    audio.muted = true;
    
    promises.push(
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
          console.log('HTML Audio unlocked via muted tick');
        })
        .catch((e) => {
          audio.muted = false;
          console.warn('HTML Audio unlock failed:', e);
        })
    );
  }
  
  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 500));
  
  unlockPromise = Promise.race([
    Promise.all(promises).then(() => {}),
    timeoutPromise
  ]).then(() => {
    audioUnlocked = true;
    console.log('Audio unlock complete');
  }).catch((e) => {
    console.warn('Audio unlock failed:', e);
    audioUnlocked = true;
  });
  
  return unlockPromise;
}

function ensurePoolAndUnlock(): Promise<void> {
  if (audioPool.size === 0) {
    audioInitialized = false;
    audioUnlocked = false;
    unlockPromise = null;
  }
  createAudioPool();
  return unlockAudioSilently();
}

export function initAudioContext(): { state: string } {
  if (audioInitialized && audioUnlocked) {
    return { state: 'running' };
  }
  ensurePoolAndUnlock();
  audioInitialized = true;
  return { state: 'running' };
}

export async function initAudioContextAsync(): Promise<{ state: string }> {
  if (audioInitialized && audioUnlocked) {
    return { state: 'running' };
  }
  await ensurePoolAndUnlock();
  audioInitialized = true;
  return { state: 'running' };
}

export function getAudioContext(): any {
  return audioInitialized ? { state: 'running' } : null;
}

export function isAudioReady(): boolean {
  return audioInitialized && audioUnlocked;
}

export function stopSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'roundEnd' | 'gameEnd' | 'applause' | 'drumroll' | 'countdown') {
  const copies = audioPool.get(soundName);
  if (!copies) return;
  
  copies.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'roundEnd' | 'gameEnd' | 'applause' | 'drumroll' | 'countdown') {
  if (audioPool.size === 0) {
    createAudioPool();
    console.warn('Audio pool created lazily, may not play on iOS');
  }
  
  if (unlockPromise && !audioUnlocked) {
    await unlockPromise;
  }
  
  const copies = audioPool.get(soundName);
  if (!copies || copies.length === 0) return;
  
  const currentIndex = audioIndex.get(soundName) || 0;
  const nextIndex = (currentIndex + 1) % copies.length;
  audioIndex.set(soundName, nextIndex);
  
  const audio = copies[currentIndex];
  
  try {
    audio.currentTime = 0;
    audio.volume = 1.0;
    await audio.play();
  } catch (e) {
    console.warn('playSound failed:', soundName, e);
  }
}

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
