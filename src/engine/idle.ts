import type { GameState } from '../types/game';
import { calculateIdleEarnings } from './economy';

interface IdleRecap {
  hoursAway: number;
  cashEarned: number;
  repEarned: number;
  racesCompleted: number;
  newMessages: number;
}

/**
 * Process offline/idle catch-up when the player returns.
 * Calculates earnings and applies them to state.
 */
export function processIdleCatchup(state: GameState, now: number = Date.now()): {
  updatedState: GameState;
  recap: IdleRecap;
} {
  const hoursAway = (now - state.lastSaveTime) / (1000 * 60 * 60);

  // Only process if away for at least 30 seconds (demo purposes — would be ~5min in prod)
  if (hoursAway < 0.008) { // ~30 seconds
    return {
      updatedState: state,
      recap: { hoursAway: 0, cashEarned: 0, repEarned: 0, racesCompleted: 0, newMessages: 0 },
    };
  }

  const earnings = calculateIdleEarnings(state, hoursAway);

  // Apply idle earnings
  const updatedState = structuredClone(state);
  updatedState.economy = {
    ...updatedState.economy,
    cash: updatedState.economy.cash + earnings.cash,
    rep: updatedState.economy.rep + earnings.rep,
  };
  updatedState.crews = { ...updatedState.crews };
  updatedState.crews.player = {
    ...updatedState.crews.player,
    cash: updatedState.crews.player.cash + earnings.cash,
  };
  updatedState.lastSaveTime = now;

  // Simulate offline races that completed
  const completedOffline = state.activeRaces.filter(
    (race) => race.endTime <= now
  );

  return {
    updatedState,
    recap: {
      hoursAway: Math.round(hoursAway * 10) / 10,
      cashEarned: earnings.cash,
      repEarned: earnings.rep,
      racesCompleted: completedOffline.length,
      newMessages: Math.floor(Math.random() * 3), // placeholder
    },
  };
}

/**
 * Check if there's idle progress to catch up on.
 */
export function hasIdleProgress(state: GameState, now: number = Date.now()): boolean {
  const hoursAway = (now - state.lastSaveTime) / (1000 * 60 * 60);
  return hoursAway >= 0.008;
}
