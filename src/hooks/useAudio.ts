/**
 * Audio hook stubs for Midnight Shift.
 * Sound effects will be implemented with Web Audio API in a future update.
 */

export function useAudio() {
  return {
    playEngine: () => {}, // stub — engine rev sound
    playCrash: () => {},  // stub — crash / near-miss sound
    playFinish: () => {}, // stub — race finish fanfare
    playAmbient: () => {}, // stub — city ambient synth
    toggleMusic: () => {}, // stub — background music toggle
  };
}
