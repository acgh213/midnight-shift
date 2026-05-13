import type { GameState, RaceResult, RaceSetup } from '../types/game';

/**
 * Apply a race result to the game state.
 * Mutates and returns a new state object (immutable style).
 */
export function applyRaceResult(state: GameState, result: RaceResult, race: RaceSetup): GameState {
  const next = structuredClone(state);

  // Update player economy
  next.economy = {
    ...next.economy,
    cash: next.economy.cash + result.rewards.cash,
    rep: next.economy.rep + result.rewards.rep,
    info: next.economy.info + result.rewards.info,
    parts: [...next.economy.parts, ...result.rewards.parts],
  };

  // Update player crew cash
  next.crews = { ...next.crews };
  next.crews.player = {
    ...next.crews.player,
    cash: next.crews.player.cash + result.rewards.cash,
    rep: next.crews.player.rep + result.rewards.rep,
  };

  // Update district control
  if (race.districtId && next.districts[race.districtId]) {
    next.districts = { ...next.districts };
    next.districts[race.districtId] = {
      ...next.districts[race.districtId],
      controlPercent: Math.min(100, Math.max(0,
        next.districts[race.districtId].controlPercent + result.districtControlChange
      )),
    };
  }

  // Apply driver stat changes
  if (result.driverStatChanges) {
    next.drivers = { ...next.drivers };
    for (const [driverId, changes] of Object.entries(result.driverStatChanges)) {
      if (next.drivers[driverId]) {
        next.drivers[driverId] = {
          ...next.drivers[driverId],
          stats: {
            ...next.drivers[driverId].stats,
            ...changes,
          },
        };
      }
    }
  }

  // Apply car condition wear (5% per race)
  for (const carId of race.playerCarIds) {
    if (next.cars[carId]) {
      next.cars[carId] = {
        ...next.cars[carId],
        condition: Math.max(0, next.cars[carId].condition - 5),
      };
    }
  }

  // Mark race as completed
  next.raceResults = { ...next.raceResults, [result.raceId]: result };
  next.completedRaceIds = [...next.completedRaceIds, result.raceId];

  // Remove from active races
  next.activeRaces = next.activeRaces.filter((r) => r.id !== race.id);

  return next;
}

/**
 * Calculate idle earnings for time spent away.
 * Simple formula: controlled districts * rep bonus * hours away (capped at 8).
 */
export function calculateIdleEarnings(
  state: GameState,
  awayHours: number,
): { cash: number; rep: number } {
  const cappedHours = Math.min(awayHours, 8);
  const controlledDistricts = Object.values(state.districts)
    .filter((d) => d.controlPercent >= 50).length;

  const baseCashPerHour = 20;
  const baseRepPerHour = 2;

  const repMultiplier = state.prestigeCarryover.repMultiplier;
  const cash = Math.floor(controlledDistricts * baseCashPerHour * cappedHours * repMultiplier);
  const rep = Math.floor(controlledDistricts * baseRepPerHour * cappedHours);

  return { cash, rep };
}
