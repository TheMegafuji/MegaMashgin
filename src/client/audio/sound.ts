import { useSyncExternalStore } from 'react';
import type { Product } from '../../shared/contracts.js';

export const SOUND_KEY = 'megafuji.cart-sound.v1';
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
    toggle: () => setCartSound(!enabled),
  };
}
/** Called only after a user gesture successfully saves an increased cart quantity. */
export function playCartSound(category: Product['category']) {
  if (!enabled || document.hidden || performance.now() - last < 140) return;
  last = performance.now();
  try {
    context ??= new AudioContext();
    const audio = context;
    const play = () => {
      if (!enabled || document.hidden || audio.state !== 'running') return;
      const voice = categoryVoices[category];
      voice.notes.forEach((hz, index) => {
        const oscillator = audio.createOscillator(),
          gain = audio.createGain();
        const start = audio.currentTime + index * 0.04,
          end = start + 0.12;
        oscillator.type = voice.wave;
        oscillator.frequency.setValueAtTime(hz, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.018 / voice.notes.length, start + 0.008);
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
    };
    if (audio.state === 'suspended')
      void audio
        .resume()
        .then(play)
        .catch(() => {});
    else play();
  } catch {
    /* Audio is enhancement only, never part of checkout correctness. */
  }
}
