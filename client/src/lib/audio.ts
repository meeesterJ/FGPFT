// Enhanced audio system using HTML5 Audio elements for iOS compatibility
// Uses synthesized sounds with proper envelopes for professional quality

let audioInitialized = false;
let audioPool: Map<string, HTMLAudioElement> = new Map();

// Generate enhanced WAV data URI with harmonics and proper envelope
function generateEnhancedTone(
  frequencies: number[], 
  amplitudes: number[], 
  duration: number,
  envelope: { attack: number; decay: number; sustain: number; release: number }
): string {
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
  
  // ADSR envelope calculation
  const attackSamples = Math.floor(sampleRate * envelope.attack);
  const decaySamples = Math.floor(sampleRate * envelope.decay);
  const releaseSamples = Math.floor(sampleRate * envelope.release);
  const sustainSamples = numSamples - attackSamples - decaySamples - releaseSamples;
  
  function getEnvelope(sampleIndex: number): number {
    if (sampleIndex < attackSamples) {
      return sampleIndex / attackSamples;
    } else if (sampleIndex < attackSamples + decaySamples) {
      const decayProgress = (sampleIndex - attackSamples) / decaySamples;
      return 1.0 - (1.0 - envelope.sustain) * decayProgress;
    } else if (sampleIndex < attackSamples + decaySamples + sustainSamples) {
      return envelope.sustain;
    } else {
      const releaseProgress = (sampleIndex - attackSamples - decaySamples - sustainSamples) / releaseSamples;
      return envelope.sustain * (1.0 - releaseProgress);
    }
  }
  
  // Generate samples with multiple frequencies (harmonics)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = getEnvelope(i);
    
    let sample = 0;
    for (let f = 0; f < frequencies.length; f++) {
      sample += Math.sin(2 * Math.PI * frequencies[f] * t) * amplitudes[f];
    }
    
    sample *= env * 0.4;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Generate a clock-like tick with sharp attack and quick decay
function generateTickSound(frequency: number, duration: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const headerSize = 44;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
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
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Exponential decay for clock-like sound
    const env = Math.exp(-t * 25);
    // Mix of frequencies for richer tick
    const sample = (
      Math.sin(2 * Math.PI * frequency * t) * 0.6 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15
    ) * env * 0.5;
    
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Generate a game-show style buzzer
function generateBuzzer(duration: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const headerSize = 44;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = headerSize + dataSize;
  
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
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
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope with quick attack and sustain then release
    let env = 1.0;
    if (t < 0.02) env = t / 0.02;
    else if (t > duration - 0.05) env = (duration - t) / 0.05;
    
    // Game show buzzer: low fundamental with harsh overtones
    const sample = (
      Math.sin(2 * Math.PI * 150 * t) * 0.4 +
      Math.sin(2 * Math.PI * 200 * t) * 0.3 +
      Math.sin(2 * Math.PI * 250 * t) * 0.2 +
      (Math.sin(2 * Math.PI * 100 * t) > 0 ? 0.1 : -0.1) // Square wave component
    ) * env * 0.5;
    
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(headerSize + i * 2, intSample, true);
  }
  
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Pre-generated enhanced audio tones
const AUDIO_TONES: Record<string, string> = {
  // Correct answer: Pleasant ascending chime with harmonics
  correct: generateEnhancedTone(
    [880, 1760, 2640], // A5 with harmonics
    [1.0, 0.5, 0.25],
    0.25,
    { attack: 0.005, decay: 0.05, sustain: 0.6, release: 0.15 }
  ),
  // Pass: Softer, lower descending tone
  pass: generateEnhancedTone(
    [440, 330], // A4 to E4
    [0.8, 0.5],
    0.15,
    { attack: 0.01, decay: 0.03, sustain: 0.4, release: 0.08 }
  ),
  // Tick: High crisp clock tick
  tick: generateTickSound(1800, 0.08),
  // Tock: Lower crisp clock tick
  tock: generateTickSound(1200, 0.1),
  // Buzz: Game-show buzzer for round end
  buzz: generateBuzzer(0.4),
};

// Pre-create audio elements for each tone
function createAudioPool() {
  if (audioPool.size > 0) return;
  
  Object.entries(AUDIO_TONES).forEach(([name, dataUri]) => {
    const audio = new Audio(dataUri);
    audio.preload = 'auto';
    audioPool.set(name, audio);
  });
  console.log('Audio pool created with', audioPool.size, 'enhanced tones');
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
      audio.volume = 0; // Silent unlock - no audible chirp
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
// iOS Safari doesn't support cloneNode for Audio, so we create new Audio from data URI
export async function playSound(soundName: 'correct' | 'pass' | 'tick' | 'tock' | 'buzz') {
  console.log('playSound:', soundName);
  
  const dataUri = AUDIO_TONES[soundName];
  if (!dataUri) {
    console.log('No audio data found for:', soundName);
    return;
  }
  
  // Create a fresh Audio element each time for iOS compatibility
  const audio = new Audio(dataUri);
  audio.volume = 1.0;
  
  try {
    await audio.play();
    console.log('playSound success:', soundName);
  } catch (e) {
    console.log('playSound failed:', soundName, e);
    // Fallback: try the pooled audio
    const pooledAudio = audioPool.get(soundName);
    if (pooledAudio) {
      try {
        pooledAudio.currentTime = 0;
        pooledAudio.volume = 1.0;
        await pooledAudio.play();
        console.log('playSound fallback success:', soundName);
      } catch (e2) {
        console.log('playSound fallback also failed:', e2);
      }
    }
  }
}

// Legacy playBeep function for compatibility - maps to new sounds
export async function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  // Map old frequency calls to new sound names
  if (frequency === 1200 || frequency === 1800) {
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
