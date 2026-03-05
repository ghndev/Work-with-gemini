let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

// Check local storage for saved preference on mount
let isMuted = false;
if (typeof window !== 'undefined') {
  isMuted = localStorage.getItem('puzzle_muted') === 'true';
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('puzzle_muted', String(muted));
  }
}

export function getMuted() {
  return isMuted;
}

/**
 * Core function to generate Web Audio API sounds
 * @param type Shape of the sound wave (sine, square, sawtooth, triangle)
 * @param startFreq Starting frequency in Hz
 * @param endFreq Ending frequency in Hz
 * @param duration Length of the sound in seconds
 * @param maxGain Volume level (0.0 to 1.0)
 */
function playSound(
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  duration: number,
  maxGain: number,
) {
  if (isMuted) return;

  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch((e) => console.warn('Audio resume blocked:', e));
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;

    // Fallback for Safari which doesn't support setValueAtTime well with currentTime 0
    const now = ctx.currentTime || 0;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gainNode.gain.setValueAtTime(maxGain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(now + duration);
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
}

export function playClick() {
  playSound('sine', 800, 300, 0.05, 0.3);
}

export function playSnap() {
  playSound('triangle', 400, 100, 0.1, 0.6);
}
