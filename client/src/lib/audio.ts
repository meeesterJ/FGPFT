// Audio system using HTML5 Audio elements for better iOS compatibility
// Web Audio API oscillators don't work reliably on iOS, but HTML5 Audio does

let audioInitialized = false;
let audioPool: HTMLAudioElement[] = [];

// Pre-generated audio tones as base64 WAV files
// These are short beep sounds at different frequencies
const AUDIO_TONES: Record<string, string> = {
  // High beep (880Hz) - correct answer
  high: generateToneDataURI(880, 0.15),
  // Medium beep (440Hz) - pass  
  medium: generateToneDataURI(440, 0.1),
  // Tick (1200Hz) - countdown tick (high, for 3 and 1)
  tick: generateToneDataURI(1200, 0.1),
  // Tock (800Hz) - countdown tock (lower, for 2)
  tock: generateToneDataURI(800, 0.1),
  // Low buzz (200Hz) - round end
  buzz: generateToneDataURI(200, 0.3),
};

// Generate a WAV data URI for a sine wave tone
function generateToneDataURI(frequency: number, duration: number): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  
  // WAV header size
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
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
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
    // Simple envelope: attack 10ms, sustain, release last 20%
    let envelope = 1.0;
    const attackTime = 0.01;
    const releaseStart = duration * 0.8;
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

// Pre-create audio elements for each tone
function createAudioPool() {
  if (audioPool.length > 0) return;
  
  Object.entries(AUDIO_TONES).forEach(([name, dataUri]) => {
    const audio = new Audio(dataUri);
    audio.preload = 'auto';
    (audio as any).toneType = name;
    audioPool.push(audio);
  });
  console.log('Audio pool created with', audioPool.length, 'tones');
}

// Initialize audio system - must be called from user gesture
export async function initAudioContext(): Promise<any> {
  if (audioInitialized) {
    console.log('Audio already initialized');
    return { state: 'running' };
  }
  
  createAudioPool();
  
  // Try to play and immediately pause each audio to "unlock" them on iOS
  const unlockPromises = audioPool.map(audio => {
    return new Promise<void>((resolve) => {
      audio.volume = 0.01;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0;
            resolve();
          })
          .catch(() => {
            audio.volume = 1.0;
            resolve();
          });
      } else {
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

// Play a beep sound using HTML5 Audio
export async function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  console.log('playBeep called with frequency:', frequency);
  
  // Map frequency to our pre-generated tones
  let toneName = 'medium';
  if (frequency >= 800) {
    toneName = 'high';
  } else if (frequency >= 500) {
    toneName = 'medium';
  } else if (frequency >= 300) {
    toneName = 'tick';
  } else {
    toneName = 'buzz';
  }
  
  // For tick sound specifically (high tick)
  if (frequency === 1200) {
    toneName = 'tick';
  }
  // For tock sound specifically (lower tick)
  if (frequency === 800) {
    toneName = 'tock';
  }
  // For buzz sound specifically  
  if (frequency === 200 && type === 'sawtooth') {
    toneName = 'buzz';
  }
  
  // Find the matching audio element
  const audio = audioPool.find(a => (a as any).toneType === toneName);
  if (!audio) {
    console.log('No audio element found for tone:', toneName);
    // Create a new one on the fly
    const dataUri = AUDIO_TONES[toneName];
    if (dataUri) {
      const newAudio = new Audio(dataUri);
      newAudio.volume = 1.0;
      try {
        await newAudio.play();
        console.log('Played new audio for tone:', toneName);
      } catch (e) {
        console.log('Failed to play new audio:', e);
      }
    }
    return;
  }
  
  try {
    // Clone the audio to allow overlapping plays
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = 1.0;
    await clone.play();
    console.log('Played audio tone:', toneName);
  } catch (e) {
    console.log('Failed to play audio:', e);
    // Try playing the original
    try {
      audio.currentTime = 0;
      audio.volume = 1.0;
      await audio.play();
    } catch (e2) {
      console.log('Fallback play also failed:', e2);
    }
  }
}
