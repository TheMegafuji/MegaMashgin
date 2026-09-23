import { useSyncExternalStore } from 'react';
import type { Product } from '../../shared/contracts.js';

export const SOUND_KEY = 'megafuji.cart-sound.v1';
export const VOLUME_KEY = 'megafuji.cart-volume.v1';
export const categoryVoices: Record<
  Product['category'],
  { notes: number[]; wave: OscillatorType }
> = {
  Snacks: { notes: [520, 780], wave: 'triangle' },
  'Sweet treats': { notes: [784, 988, 1175], wave: 'sine' },
  Bakery: { notes: [392, 494], wave: 'sine' },
  Drinks: { notes: [659, 988], wave: 'sine' },
  'Coffee & cups': { notes: [440, 554, 659], wave: 'triangle' },
  Sandwiches: { notes: [349, 523], wave: 'triangle' },
  Salads: { notes: [587, 740], wave: 'sine' },
  'Hot food': { notes: [330, 440, 554], wave: 'triangle' },
  Fruit: { notes: [880, 1175], wave: 'sine' },
};
function savedPreference() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}
let enabled = savedPreference();
function savedVolume() {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    const value = raw === null ? 0.6 : Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.6;
  } catch {
    return 0.6;
  }
}
let volume = savedVolume();
export function setCartVolume(value: number) {
  if (!Number.isFinite(value)) return;
  volume = Math.max(0, Math.min(1, value));
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    /* Optional preference. */
  }
  for (const listener of listeners) listener();
}
let context: AudioContext | undefined;
let last = -Infinity;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function setCartSound(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(SOUND_KEY, value ? 'on' : 'off');
  } catch {
    /* Preference is optional. */
  }
  for (const listener of listeners) listener();
}
export function useCartSound() {
  return {
    enabled: useSyncExternalStore(
      subscribe,
      () => enabled,
      () => false,
    ),
    volume: useSyncExternalStore(
      subscribe,
      () => volume,
      () => 0.6,
    ),
    setVolume: setCartVolume,
    toggle: () => setCartSound(!enabled),
  };
}
/** User gesture only: accepted additions or the explicit sound preview. */
export async function playCartSound(
  category: Product['category'],
  preview = false,
): Promise<boolean> {
  if (!enabled || volume === 0 || document.hidden || (!preview && performance.now() - last < 140))
    return false;
  last = performance.now();
  try {
    if (!context || context.state === 'closed')
      context = new AudioContext({ latencyHint: 'interactive' });
    const audio = context;
    if (audio.state !== 'running') await audio.resume();
    if (!enabled || document.hidden || audio.state !== 'running') return false;
    const voice = categoryVoices[category];
    voice.notes.forEach((hz, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + 0.01 + index * 0.065;
      const end = start + 0.22;
      oscillator.type = voice.wave;
      oscillator.frequency.setValueAtTime(hz, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, (0.16 * volume) / Math.sqrt(voice.notes.length)),
        start + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(end + 0.01);
    });
    return true;
  } catch {
    return false; /* Audio failure never blocks checkout. */
  }
}
