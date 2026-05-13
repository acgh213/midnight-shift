// Race simulation engine
// Deterministic, tick-based. Pure function: (setup, drivers, cars, district) → event log.

import type { RaceSetup, RaceResult, RaceEvent, District } from '../types/game';
import { createPRNG, d100 } from './prng';

const TICK_COUNT: Record<string, number> = { '5m': 20, '30m': 60, '4h': 120, '8h': 200 };

export function simulateRace(
  race: RaceSetup,
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  district: District,
): RaceResult {
  const rand = createPRNG(race.seed);
  const ticks = TICK_COUNT[race.length] || 60;
  const events: RaceEvent[] = [];

  // Simulate positions for player drivers
  // In full implementation, this uses driver/car stats + road conditions
  for (let tick = 0; tick < ticks; tick++) {
    // 5% chance of a notable event per tick
    if (d100(rand) < 5) {
      events.push({
        tick,
        type: 'OVERTAKE',
        drivers: [race.playerDriverIds[0]],
        severity: d100(rand),
        location: district.name,
      });
    }
  }

  // Always add a finish event
  events.push({
    tick: ticks,
    type: 'FINISH',
    drivers: race.playerDriverIds,
    severity: 0,
    location: district.name,
  });

  // Determine outcome based on stake level
  const outcomeRoll = d100(rand);
  const winThreshold = race.stakes === 'low' ? 80 : race.stakes === 'mid' ? 60 : race.stakes === 'high' ? 40 : 30;
  const outcome = outcomeRoll >= winThreshold ? 'win' : (outcomeRoll >= winThreshold - 10 ? 'draw' : 'loss');

  const rewardMultiplier = race.stakes === 'low' ? 1 : race.stakes === 'mid' ? 2 : race.stakes === 'high' ? 4 : 8;

  return {
    raceId: race.id,
    outcome: outcome as 'win' | 'loss' | 'draw',
    position: outcome === 'win' ? 1 : outcome === 'draw' ? 2 : 3,
    finishTime: Date.now(),
    events,
    rewards: {
      cash: outcome === 'win' ? 100 * rewardMultiplier : outcome === 'draw' ? 30 * rewardMultiplier : 0,
      rep: outcome === 'win' ? 5 * rewardMultiplier : 1,
      parts: [],
      info: Math.floor(Math.random() * 3) + 1,
    },
    driverStatChanges: outcome === 'win'
      ? { [race.playerDriverIds[0]]: { speed: 1, reputation: 2 } }
      : {},
    districtControlChange: outcome === 'win' ? 3 : outcome === 'loss' ? -1 : 0,
  };
}

export function simulateOfflineRaces(
  completedRaces: RaceSetup[],
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  districts: Record<string, District>,
): RaceResult[] {
  return completedRaces.map((race) =>
    simulateRace(race, _drivers, _cars, districts[race.districtId])
  );
}
