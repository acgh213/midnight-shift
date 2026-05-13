/**
 * Web Audio API sound system for Midnight Shift.
 * All sounds generated procedurally — no external audio files.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../state/store';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — silently skip
  }
}

function playNoise(duration: number, volume = 0.05) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Audio not available
  }
}

export function useAudio() {
  const soundEnabled = useGameStore((s) => s.game.settings.soundEnabled);
  const musicVolume = useGameStore((s) => s.game.settings.musicVolume);
  const ambientRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  const playEngine = useCallback(() => {
    if (!soundEnabled) return;
    playNoise(0.15, 0.04);
    playTone(80, 0.1, 'sawtooth', 0.04);
  }, [soundEnabled]);

  const playCrash = useCallback(() => {
    if (!soundEnabled) return;
    playNoise(0.3, 0.1);
    playTone(60, 0.2, 'sawtooth', 0.06);
  }, [soundEnabled]);

  const playFinish = useCallback(() => {
    if (!soundEnabled) return;
    // Ascending victory fanfare
    playTone(440, 0.15, 'square', 0.06);
    setTimeout(() => playTone(554, 0.15, 'square', 0.06), 100);
    setTimeout(() => playTone(659, 0.25, 'square', 0.07), 200);
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    playTone(800, 0.03, 'square', 0.03);
  }, [soundEnabled]);

  const playPurchase = useCallback(() => {
    if (!soundEnabled) return;
    playTone(600, 0.08, 'triangle', 0.05);
    setTimeout(() => playTone(900, 0.1, 'triangle', 0.06), 60);
  }, [soundEnabled]);

  // Ambient synth drone
  useEffect(() => {
    if (!soundEnabled) {
      if (ambientRef.current) {
        ambientRef.current.stop();
        ambientRef.current = null;
      }
      return;
    }

    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, ctx.currentTime); // low A

      const vol = (musicVolume / 100) * 0.03;
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      // Slow filter sweep for movement
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 8);
      filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      ambientRef.current = osc;
      ambientGainRef.current = gain;
    } catch {
      // Audio not available
    }

    return () => {
      if (ambientRef.current) {
        try { ambientRef.current.stop(); } catch {}
        ambientRef.current = null;
      }
    };
  }, [soundEnabled, musicVolume]);

  return { playEngine, playCrash, playFinish, playClick, playPurchase };
}
