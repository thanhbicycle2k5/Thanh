import { NotificationSound } from '../types';

let audioCtx: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext> {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return audioCtx;
}

async function playBirdChirp() {
  const ctx = await getAudioContext();
  const now = ctx.currentTime;

  const chirpPattern = [0, 0.15, 0.3, 0.5, 0.65, 0.8];
  chirpPattern.forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freq = 2400 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + offset);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + offset + 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + offset + 0.1);

    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

async function playWindSound() {
  const ctx = await getAudioContext();
  const now = ctx.currentTime;
  const duration = 2.5;

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.linearRampToValueAtTime(800, now + 1.2);
  filter.frequency.linearRampToValueAtTime(350, now + duration);
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
  gain.gain.linearRampToValueAtTime(0.2, now + 1.2);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);
}

async function playBellSound() {
  const ctx = await getAudioContext();
  const now = ctx.currentTime;

  const harmonics = [1, 2.756, 5.404, 8.933, 13.394];
  const amplitudes = [1, 0.5, 0.25, 0.12, 0.06];

  harmonics.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = 520 * ratio;

    gain.gain.setValueAtTime(amplitudes[i] * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5 - i * 0.1);

    osc.start(now);
    osc.stop(now + 2.5);
  });
}

async function playChimeSound() {
  const ctx = await getAudioContext();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = freq;

    const startTime = now + i * 0.18;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

    osc.start(startTime);
    osc.stop(startTime + 2);
  });
}

export async function playNotificationSound(type: NotificationSound) {
  try {
    switch (type) {
      case 'bird':
        await playBirdChirp();
        break;
      case 'wind':
        await playWindSound();
        break;
      case 'bell':
        await playBellSound();
        break;
      case 'chime':
        await playChimeSound();
        break;
    }
  } catch (e) {
    console.error('Failed to play sound', e);
  }
}

const SCALE_FREQUENCIES = [
  261.63, // Do (C4)
  293.66, // Re (D4)
  329.63, // Mi (E4)
  349.23, // Fa (F4)
  392.00, // Sol (G4)
  440.00, // La (A4)
  493.88, // Si (B4)
  523.25  // Do (C5)
];

let noteIndex = 0;

export async function playMusicalNote() {
  try {
    const ctx = await getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Smooth tone with sine wave
    osc.type = 'sine';
    osc.frequency.setValueAtTime(SCALE_FREQUENCIES[noteIndex], now);
    
    // Quick attack and decay for a "plucky" or "tinkly" sound
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc.start(now);
    osc.stop(now + 1);
    
    // Advance index for next call
    noteIndex = (noteIndex + 1) % SCALE_FREQUENCIES.length;
  } catch (e) {
    console.error('Failed to play musical note', e);
  }
}

export async function playCompletionMelody() {
  try {
    const ctx = await getAudioContext();
    const now = ctx.currentTime;
    const melody = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
    const stepDuration = 0.28;
    const gap = 0.05;

    melody.forEach((frequency, index) => {
      const startTime = now + index * (stepDuration + gap);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration);

      osc.start(startTime);
      osc.stop(startTime + stepDuration + gap);
    });
  } catch (e) {
    console.error('Failed to play completion melody', e);
  }
}

let meowAudio: HTMLAudioElement | null = null;

async function playFallbackMeow() {
  try {
    const ctx = await getAudioContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    // two-note meow gliss
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    console.error('Failed to play fallback meow', e);
  }
}

export async function playMeow() {
  try {
    if (!meowAudio) {
      meowAudio = new Audio('/cat-meow.ogg');
      meowAudio.preload = 'auto';
    }
    if (meowAudio.paused === false) {
      meowAudio.currentTime = 0;
    }
    await meowAudio.play();
  } catch (e) {
    console.warn('Failed to play cat meow audio asset, falling back to synth.', e);
    await playFallbackMeow();
  }
}
