import { useCallback, useState } from 'react';

export type SoundEffect =
  | 'click'
  | 'hint'
  | 'error'
  | 'success'
  | 'unlock'
  | 'case-closed';

const SOUND_SETTING_KEY = 'switched-sample-sound-effects';
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  volume: number,
  waveform: OscillatorType = 'sine',
) {
  const start = context.currentTime + startOffset;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playEffect(effect: SoundEffect, enabled: boolean) {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();

  switch (effect) {
    case 'click':
      playTone(context, 560, 0, 0.045, 0.035, 'triangle');
      break;
    case 'hint':
      playTone(context, 520, 0, 0.09, 0.04);
      playTone(context, 740, 0.08, 0.12, 0.035);
      break;
    case 'error':
      playTone(context, 205, 0, 0.12, 0.045, 'triangle');
      playTone(context, 155, 0.1, 0.16, 0.035, 'triangle');
      break;
    case 'success':
      playTone(context, 440, 0, 0.1, 0.04);
      playTone(context, 587, 0.08, 0.12, 0.04);
      playTone(context, 784, 0.17, 0.16, 0.035);
      break;
    case 'unlock':
      playTone(context, 180, 0, 0.15, 0.045, 'square');
      playTone(context, 620, 0.13, 0.13, 0.035, 'triangle');
      playTone(context, 830, 0.24, 0.18, 0.035);
      break;
    case 'case-closed':
      playTone(context, 392, 0, 0.2, 0.04);
      playTone(context, 494, 0.1, 0.22, 0.04);
      playTone(context, 587, 0.2, 0.25, 0.04);
      playTone(context, 784, 0.32, 0.38, 0.035);
      break;
  }
}

function readSoundPreference() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_SETTING_KEY) === 'on';
  } catch {
    return false;
  }
}

export function useSoundEffects() {
  const [enabled, setEnabled] = useState(readSoundPreference);

  const play = useCallback(
    (effect: SoundEffect) => playEffect(effect, enabled),
    [enabled],
  );

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(SOUND_SETTING_KEY, next ? 'on' : 'off');
    } catch {
      // Sound can still be toggled for this session if storage is unavailable.
    }
    if (next) playEffect('click', true);
  }, [enabled]);

  return { enabled, play, toggle };
}
