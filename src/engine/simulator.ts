// Race simulation engine
// Deterministic, tick-based. Uses driver/car stats + district hazards.

import type { RaceSetup, RaceResult, RaceEvent, District, Driver, Car } from '../types/game';
import { createPRNG, d100 } from './prng';

const TICK_COUNT: Record<string, number> = { '5m': 20, '30m': 60, '4h': 120, '8h': 200 };

interface SimDriver {
  id: string;
  speed: number;
  control: number;
  aggression: number;
  reputation: number;
  name: string;
}

interface SimCar {
  id: string;
  topSpeed: number;
  control: number;
  aggression: number;
  durability: number;
}

function getSimDriver(driverId: string, drivers: Record<string, Driver>): SimDriver | null {
  const d = drivers[driverId];
  if (!d) return null;
  return {
    id: d.id,
    speed: d.stats.speed,
    control: d.stats.control,
    aggression: d.stats.aggression,
    reputation: d.stats.reputation,
    name: d.name,
  };
}

function getSimCar(carId: string, cars: Record<string, Car>): SimCar | null {
  const c = cars[carId];
  if (!c) return null;
  return {
    id: c.id,
    topSpeed: c.stats.topSpeed,
    control: c.stats.control,
    aggression: c.stats.aggression,
    durability: c.stats.durability,
  };
}

export function simulateRace(
  race: RaceSetup,
  drivers: Record<string, Driver>,
  cars: Record<string, Car>,
  district: District,
): RaceResult {
  const rand = createPRNG(race.seed);
  const ticks = TICK_COUNT[race.length] || 60;
  const events: RaceEvent[] = [];

  // Build player driver/car
  const playerDriver = getSimDriver(race.playerDriverIds[0], drivers);
  const playerCar = getSimCar(race.playerCarIds[0], cars);

  // Default stats if driver/car not found
  const pSpeed = (playerDriver?.speed ?? 30) + (playerCar?.topSpeed ?? 30);
  const pControl = (playerDriver?.control ?? 30) + (playerCar?.control ?? 30);
  const pAggression = (playerDriver?.aggression ?? 30) + (playerCar?.aggression ?? 20);
  const pDurability = playerCar?.durability ?? 50;

  // Rival stats — scaled by stake level and night
  const rivalMultiplier = race.stakes === 'boss' ? 1.3 : race.stakes === 'high' ? 1.1 : race.stakes === 'mid' ? 0.9 : 0.7;
  const rSpeed = Math.round((40 + d100(rand) * 0.4) * rivalMultiplier);
  const rAggression = 30 + d100(rand) * 0.5;

  // Posture modifier
  const postureAggressionMul = race.posture === 'reckless' ? 1.4 : race.posture === 'push' ? 1.1 : 0.9;
  const postureControlMul = race.posture === 'safe' ? 1.2 : race.posture === 'push' ? 1.0 : 0.8;

  const effectivePAggression = pAggression * postureAggressionMul;
  const effectivePControl = pControl * postureControlMul;

  // Hazard chance from district
  const hazardBase = district.hazardList.length * 2; // 6-8% base

  // Track positions (normalized 0-100, player relative to rival)
  let playerPos = 50;
  let rivalPos = 50;
  let playerDmg = 0;

  for (let tick = 0; tick < ticks; tick++) {
    // Speed differential determines position change
    const speedDiff = pSpeed - rSpeed;
    playerPos += Math.round(speedDiff * 0.3 + (rand() - 0.5) * 10);
    rivalPos += Math.round(-speedDiff * 0.3 + (rand() - 0.5) * 10);
    playerPos = Math.max(0, Math.min(100, playerPos));
    rivalPos = Math.max(0, Math.min(100, rivalPos));

    // Event chance based on posture and aggression
    const eventChance = 3 + effectivePAggression * 0.15 + hazardBase * 0.3;
    if (d100(rand) < eventChance) {
      const eventRoll = d100(rand);
      const controlCheck = effectivePControl + d100(rand);

      if (eventRoll < 20 && controlCheck < 80) {
        // CRASH_OUT — high aggression, low control
        const crashSeverity = d100(rand);
        playerDmg += crashSeverity * 0.4;
        playerPos -= 15;
        events.push({
          tick,
          type: 'CRASH_OUT',
          drivers: race.playerDriverIds,
          severity: crashSeverity,
          location: district.name,
        });
        // Durability check — can the car continue?
        if (pDurability - playerDmg < 20) {
          events.push({
            tick,
            type: 'MECHANICAL',
            drivers: race.playerDriverIds,
            severity: 80,
            location: `${district.name} — ${playerDriver?.name ?? 'Driver'} limping to finish`,
          });
          break; // Car too damaged, race ends here
        }
      } else if (eventRoll < 45 && controlCheck < 100) {
        // NEAR_MISS or CRASH_RECOVER
        const severity = d100(rand);
        if (severity > 60) {
          events.push({
            tick,
            type: 'CRASH_RECOVER',
            drivers: race.playerDriverIds,
            severity,
            location: district.name,
          });
          playerPos -= 5;
        } else {
          events.push({
            tick,
            type: 'NEAR_MISS',
            drivers: race.playerDriverIds,
            severity,
            location: district.name,
          });
        }
      } else if (eventRoll < 70) {
        // OVERTAKE — speed + aggression check
        const overtakeSuccess = pSpeed + effectivePAggression * 0.5 > rSpeed + rAggression * 0.3 + 30;
        if (overtakeSuccess) {
          playerPos += 10;
          events.push({
            tick,
            type: 'OVERTAKE',
            drivers: race.playerDriverIds,
            severity: d100(rand),
            location: district.name,
          });
        }
      } else if (eventRoll < 85) {
        // MECHANICAL issue
        playerDmg += 10;
        events.push({
          tick,
          type: 'MECHANICAL',
          drivers: race.playerDriverIds,
          severity: d100(rand),
          location: district.name,
        });
      }
    }
  }

  // Always add finish event
  events.push({
    tick: ticks,
    type: 'FINISH',
    drivers: race.playerDriverIds,
    severity: 0,
    location: district.name,
  });

  // Determine outcome
  const playerAhead = playerPos > rivalPos;
  const margin = Math.abs(playerPos - rivalPos);
  const postureLabel = race.posture === 'reckless' ? 'wild' : race.posture === 'push' ? 'aggressive' : 'clean';

  let outcome: 'win' | 'loss' | 'draw';
  if (playerDmg > pDurability * 0.7) {
    outcome = 'loss'; // too damaged
  } else if (margin < 5) {
    outcome = 'draw';
  } else if (playerAhead) {
    outcome = 'win';
  } else {
    outcome = 'loss';
  }

  const position = outcome === 'win' ? 1 : outcome === 'draw' ? 2 : 3;
  const rewardMultiplier = race.stakes === 'low' ? 1 : race.stakes === 'mid' ? 2 : race.stakes === 'high' ? 4 : 8;

  const driverName = playerDriver?.name ?? 'Unknown driver';
  const carLabel = playerCar ? `Class ${cars[race.playerCarIds[0]]?.class ?? '?'}` : '';

  // Generate a narrative result line
  const resultLines: Record<string, string> = {
    win: `${driverName} takes it! A ${postureLabel} run through ${district.name}. ${carLabel} held the line.`,
    loss: `${driverName} couldn't close the gap. ${district.name} belongs to the rivals tonight.`,
    draw: `Photo finish in ${district.name}. ${driverName} and the rival cross together. Dead heat.`,
  };

  return {
    raceId: race.id,
    outcome,
    position,
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
    narrative: resultLines[outcome],
  } as RaceResult & { narrative?: string };
}

export function simulateOfflineRaces(
  completedRaces: RaceSetup[],
  drivers: Record<string, Driver>,
  cars: Record<string, Car>,
  districts: Record<string, District>,
): RaceResult[] {
  return completedRaces.map((race) =>
    simulateRace(race, drivers, cars, districts[race.districtId])
  );
}
