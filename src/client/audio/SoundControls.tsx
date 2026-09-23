import { useState } from 'react';
import { SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { playCartSound, useCartSound } from './sound.js';

export function SoundControls() {
  const sound = useCartSound();
  const [message, setMessage] = useState('');
  return (
    <div className="sound-controls">
      <button
        className="sound-toggle"
        aria-label={sound.enabled ? 'Mute cart sounds' : 'Enable cart sounds'}
        aria-pressed={sound.enabled}
        title={sound.enabled ? 'Cart sounds on' : 'Cart sounds off'}
        onClick={sound.toggle}
      >
        {sound.enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
      <details className="sound-settings">
        <summary aria-label="Sound settings" title="Sound settings">
          <SlidersHorizontal size={16} />
        </summary>
        <div className="sound-panel">
          <strong>Make it sound right.</strong>
          <p>A short chime when you add something good.</p>
          <label htmlFor="cart-volume">
            Volume <output>{Math.round(sound.volume * 100)}%</output>
          </label>
          <input
            id="cart-volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(sound.volume * 100)}
            onChange={(e) => {
              sound.setVolume(Number(e.target.value) / 100);
              setMessage('');
            }}
          />
          <button
            className="secondary-button"
            disabled={!sound.enabled || sound.volume === 0}
            onClick={async () =>
              setMessage(
                (await playCartSound('Sweet treats', true))
                  ? 'Sound played. If silent, check your tab and device volume.'
                  : 'Audio could not start. Check your browser sound settings.',
              )
            }
          >
            <Volume2 size={16} />
            Test sound
          </button>
          <p role="status">
            {!sound.enabled
              ? 'Enable cart sounds with the speaker button.'
              : sound.volume === 0
                ? 'Raise the volume to hear a preview.'
                : message || 'No music or autoplay. You control the volume.'}
          </p>
        </div>
      </details>
    </div>
  );
}
