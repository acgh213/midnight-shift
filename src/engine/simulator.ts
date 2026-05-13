// Race simulation engine
// Deterministic, tick-based. Pure function: (state, seed) → event log.
// Lives in a Web Worker for v0 to avoid blocking the main thread.

import type { RaceSetup, RaceResult, RaceEvent, District, DistrictId } from '../types/game';

/**
 * Simulate a complete race and return the result.
 * This is the main entry point — called from the worker or inline.
 */
export function simulateRace(
  race: RaceSetup,
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  district: District,
): RaceResult {
  // Placeholder — returns a trivial result
  const events: RaceEvent[] = [{
    tick: 1,
    type: 'FINISH',
    drivers: race.playerDriverIds,
    severity: 0,
    location: district.name,
  }];

  return {
    raceId: race.id,
    outcome: 'win',
    position: 1,
    finishTime: race.endTime,
    events,
    rewards: { cash: 100, rep: 5, parts: [], info: 2 },
    driverStatChanges: {},
    districtControlChange: 2,
  };
}

/**
 * Simulate all completed races (offline catch-up).
 * Called when the player returns after being away.
 */
export function simulateOfflineRaces(
  completedRaces: RaceSetup[],
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  districts: Record<DistrictId, District>,
): RaceResult[] {
  return completedRaces.map((race) =>
    simulateRace(race, _drivers, _cars, districts[race.districtId])
  );
}
