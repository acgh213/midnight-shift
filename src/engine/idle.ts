import type { GameState, GameEvent } from '../types/game';
import { calculateIdleEarnings } from './economy';
import { processRivalAI } from './rival-ai';
import { generateSpecialEvents } from './events';

export interface IdleRecap {
  hoursAway: number;
  cashEarned: number;
  repEarned: number;
  racesCompleted: number;
  newEvents: number;
  events: GameEvent[];
}

/**
 * Process offline/idle catch-up when the player returns.
 * Calculates earnings, processes rival AI, and applies results.
 */
export function processIdleCatchup(state: GameState, now: number = Date.now()): {
  updatedState: GameState;
  recap: IdleRecap;
} {
  const hoursAway = (now - state.lastSaveTime) / (1000 * 60 * 60);

  // Only process if away for at least 30 seconds
  if (hoursAway < 0.008) {
    const noRecap: IdleRecap = { hoursAway: 0, cashEarned: 0, repEarned: 0, racesCompleted: 0, newEvents: 0, events: [] };
    return { updatedState: state, recap: noRecap };
  }

  // Calculate idle earnings
  const earnings = calculateIdleEarnings(state, hoursAway);
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

  // Process rival AI — rivals make moves while you're away
  const rivalSeed = state.night * 10000 + Math.floor(hoursAway);
  const rivalEvents = processRivalAI(updatedState, hoursAway, rivalSeed);

  // Add rival events to recent events (keep last 20)
  updatedState.recentEvents = [...rivalEvents, ...(updatedState.recentEvents || [])].slice(0, 20);

  // Generate special events (tournaments, crackdowns, etc.)
  const eventSeed = state.night * 20000 + Math.floor(hoursAway * 100);
  const specialEvents = generateSpecialEvents(updatedState, hoursAway, eventSeed);
  // Auto-resolve expired events from last session
  const existingEvents = (updatedState.specialEvents || [])
    .filter((e) => !e.resolved)
    .map((e) => (e.expiresAt < now ? { ...e, resolved: true, result: 'Event expired while you were away.' } : e));
  updatedState.specialEvents = [...existingEvents, ...specialEvents].slice(0, 10);

  // Count completed offline races
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
      newEvents: rivalEvents.length,
      events: rivalEvents,
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
