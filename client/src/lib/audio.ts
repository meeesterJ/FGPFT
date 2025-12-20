// Audio system using HTML5 Audio elements for iOS compatibility
// Uses simple sine wave WAV generation for reliable playback

let audioInitialized = false;
let audioPool: Map<string, HTMLAudioElement> = new Map();

// Generate a simple WAV data URI for a sine wave tone with envelope
function generateToneDataURI(frequency: number, duration: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const headerSize = 44;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Generate audio samples with envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Simple envelope: quick attack, sustain, fade out last 30%
    let envelope = 1.0;
    const attackTime = 0.01;
    const releaseStart = duration * 0.7;
    if (t < attackTime) {
      envelope = t / attackTime;
    } else if (t > releaseStart) {
      envelope = 1.0 - ((t - releaseStart) / (duration - releaseStart));
    }
    
    // Generate sine wave
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }
  
  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Pre-generated audio tones - simple sine waves at different frequencies
const AUDIO_TONES: Record<string, string> = {
  // Correct answer: Higher pitch (880Hz)
  correct: generateToneDataURI(880, 0.15),
  // Pass: Lower pitch (440Hz)
  pass: generateToneDataURI(440, 0.12),
  // Tick: High crisp tick (1200Hz)
  tick: generateToneDataURI(1200, 0.08),
  // Tock: Lower tick (800Hz)
  tock: generateToneDataURI(800, 0.1),
  // Buzz: Low buzzer (200Hz)
  buzz: generateToneDataURI(200, 0.3),
};

// Pre-create audio elements for each tone
function createAudioPool() {
  if (audioPool.size > 0) return;
  
  Object.entries(AUDIO_TONES).forEach(([name, dataUri]) => {
    const audio = new Audio(dataUri);
    audio.preload = 'auto';
    audioPool.set(name, audio);
  });
  console.log('Audio pool created with', audioPool.size, 'tones');
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
export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'buzz') {
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
