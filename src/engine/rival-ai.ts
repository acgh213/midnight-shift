import type { Crew, Driver, Car, GameState, CarClass, PersonalityTag, CarArchetype, GameEvent } from '../types/game';
import { createPRNG } from './prng';

const POACH_LOYALTY_THRESHOLD = 30;

let eventSeq = 0;
function eventId(type: string): string {
  return `${type}-${Date.now()}-${++eventSeq}`;
}

/**
 * Process rival crew AI for a given elapsed time.
 * Called during idle catchup and on game tick.
 * Mutates the state in place to add challenges, upgrades, etc.
 * Returns events for Message Board posting.
 */
export function processRivalAI(
  state: GameState,
  elapsedHours: number,
  seed: number,
): GameEvent[] {
  const rand = createPRNG(seed);
  const events: GameEvent[] = [];
  const rivalCrews = Object.values(state.crews).filter((c) => c.id !== 'player');

  for (const rival of rivalCrews) {
    const actionCount = Math.max(0, Math.floor(elapsedHours / 8) + (rand() > 0.5 ? 1 : 0));
    if (actionCount === 0) continue;

    for (let i = 0; i < actionCount; i++) {
      const roll = rand();
      let event: GameEvent | null = null;

      if (roll < 0.25 && rival.cash >= 300) {
        event = rivalUpgrade(state, rival, rand);
      } else if (roll < 0.45 && rival.cash >= 200) {
        event = rivalRecruit(state, rival, rand);
      } else if (roll < 0.65 && playerHasLowLoyalty(state) && rand() > 0.5) {
        event = rivalPoach(state, rival, rand);
      } else if (roll < 0.85) {
        event = rivalChallenge(state, rival);
      } else {
        event = rivalTaunt(rival, rand);
      }

      if (event) events.push(event);
    }
  }

  return events;
}

function rivalUpgrade(
  state: GameState,
  rival: Crew,
  rand: () => number,
): GameEvent {
  const archetypes: CarArchetype[] = ['jdm-tuner', 'euro-precision', 'american-muscle', 'kei-special', 'rally-hybrid'];
  const classes: CarClass[] = ['C', 'B', 'A'];
  const archetype = archetypes[Math.floor(rand() * archetypes.length)];
  const carClass = classes[Math.floor(rand() * classes.length)];

  const baseSpeed = classBaseStat(carClass, 30, 15);
  const baseControl = classBaseStat(carClass, 30, 15);
  const aggression = 30 + Math.floor(rand() * 50);
  const durability = 40 + Math.floor(rand() * 40);

  const carCost = classCarCost(carClass);
  if (rival.cash < carCost) {
    return {
      id: eventId('taunt'),
      type: 'taunt',
      crewId: rival.id,
      crewName: rival.name,
      description: `${rival.name} are saving up for something big.`,
      timestamp: Date.now(),
    };
  }

  const carId = `rival-car-${rival.id}-${Date.now()}`;
  const car: Car = {
    id: carId,
    name: rivalCarName(rand),
    archetype,
    class: carClass,
    stats: { topSpeed: baseSpeed, control: baseControl, aggression, durability },
    parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
    condition: 80 + Math.floor(rand() * 20),
    cosmetics: { paint: '#333333', decals: [], neonColor: '', bodyKit: '', plate: '' },
    isSignature: false,
    ownerId: rival.id,
    assignedDriverId: null,
  };

  state.cars[carId] = car;
  state.crews[rival.id] = { ...rival, cars: [...rival.cars, carId], cash: rival.cash - carCost };

  return {
    id: eventId('upgrade'),
    type: 'upgrade',
    crewId: rival.id,
    crewName: rival.name,
    description: `${rival.name} just picked up a new ${carClass}-class ${car.name}. Eyes on the street.`,
    timestamp: Date.now(),
  };
}

function rivalRecruit(
  state: GameState,
  rival: Crew,
  rand: () => number,
): GameEvent {
  const names = ['Recruit', 'Rookie', 'Wheelman', 'Stunt', 'Pilot', 'Runner'];
  const personalities: PersonalityTag[] = ['hothead', 'hungry', 'local', 'cowboy', 'tinker'];

  const driverId = `rival-driver-${rival.id}-${Date.now()}`;
  const driver: Driver = {
    id: driverId,
    name: names[Math.floor(rand() * names.length)],
    nickname: '',
    backstory: `New blood running with ${rival.name}.`,
    stats: {
      speed: 20 + Math.floor(rand() * 40),
      control: 20 + Math.floor(rand() * 40),
      aggression: 30 + Math.floor(rand() * 40),
      reputation: 5 + Math.floor(rand() * 20),
    },
    personality: personalities[Math.floor(rand() * personalities.length)],
    loyalty: 30 + Math.floor(rand() * 40),
    carPreference: 'jdm-tuner' as CarArchetype,
    rivalries: [],
    crewId: rival.id,
    history: [],
    isSignature: false,
  };

  state.drivers[driverId] = driver;
  state.crews[rival.id] = { ...rival, drivers: [...rival.drivers, driverId] };

  return {
    id: eventId('recruit'),
    type: 'recruit',
    crewId: rival.id,
    crewName: rival.name,
    description: `${rival.name} has fresh talent in the garage. ${driver.name} — unknown, untested, probably desperate.`,
    timestamp: Date.now(),
  };
}

function rivalPoach(
  state: GameState,
  rival: Crew,
  rand: () => number,
): GameEvent | null {
  const playerCrew = state.crews.player;
  const playerDrivers = playerCrew.drivers
    .map((id) => state.drivers[id])
    .filter((d) => d && d.loyalty < POACH_LOYALTY_THRESHOLD && !d.isSignature);

  if (playerDrivers.length === 0) return null;

  const target = playerDrivers[Math.floor(rand() * playerDrivers.length)];
  if (!target) return null;

  const successChance = 0.5 + (POACH_LOYALTY_THRESHOLD - target.loyalty) / POACH_LOYALTY_THRESHOLD * 0.4;
  const success = rand() < successChance;

  if (success) {
    const updatedDriver = { ...target, crewId: rival.id, loyalty: 50 };
    state.drivers[target.id] = updatedDriver;
    state.crews.player = {
      ...playerCrew,
      drivers: playerCrew.drivers.filter((id) => id !== target.id),
    };
    state.crews[rival.id] = {
      ...rival,
      drivers: [...rival.drivers, target.id],
    };

    return {
      id: eventId('poach'),
      type: 'poach',
      crewId: rival.id,
      crewName: rival.name,
      description: `${target.name} just walked. Joined ${rival.name}. Loyalty was ${target.loyalty} — they saw it coming.`,
      timestamp: Date.now(),
    };
  }

  return {
    id: eventId('poach-fail'),
    type: 'taunt',
    crewId: rival.id,
    crewName: rival.name,
    description: `${rival.name} tried to poach ${target.name}. ${target.name} said no — for now. Loyalty: ${target.loyalty}.`,
    timestamp: Date.now(),
  };
}

function rivalChallenge(
  state: GameState,
  rival: Crew,
): GameEvent {
  const district = Object.values(state.districts).find((d) => d.rivalCrewId === rival.id);
  const districtName = district?.name ?? 'the city';

  return {
    id: eventId('challenge'),
    type: 'challenge',
    crewId: rival.id,
    crewName: rival.name,
    description: `${rival.name} wants a piece of Midnight Shift. Challenge posted for ${districtName}.`,
    timestamp: Date.now(),
    districtId: district?.id,
  };
}

function rivalTaunt(
  rival: Crew,
  rand: () => number,
): GameEvent {
  const taunts = [
    `"Still running that junker?" — ${rival.name}`,
    `${rival.name} says your crew's looking thin.`,
    `Word on the street: ${rival.name} doesn't consider you a threat.`,
    `"Come find us when you're ready to lose." — ${rival.name}`,
    `${rival.name} posted your last race time. Called it "cute."`,
  ];

  return {
    id: eventId('taunt'),
    type: 'taunt',
    crewId: rival.id,
    crewName: rival.name,
    description: taunts[Math.floor(rand() * taunts.length)],
    timestamp: Date.now(),
  };
}

// --- Helpers ---

function playerHasLowLoyalty(state: GameState): boolean {
  return state.crews.player.drivers.some((id) => {
    const d = state.drivers[id];
    return d && d.loyalty < POACH_LOYALTY_THRESHOLD;
  });
}

function classBaseStat(_carClass: CarClass, base: number, step: number): number {
  const tier = { C: 0, B: 1, A: 2, S: 3 }[_carClass];
  return Math.min(100, base + tier * step);
}

function classCarCost(carClass: CarClass): number {
  return { C: 200, B: 500, A: 1200, S: 3000 }[carClass];
}

const CAR_NAME_PARTS = [
  ['Shadow', 'Ghost', 'Phantom', 'Midnight', 'Neon', 'Rust', 'Iron', 'Glass', 'Salt', 'Fog'],
  ['Runner', 'Drift', 'Strike', 'Line', 'Fang', 'Claw', 'Edge', 'Wave', 'Bolt', 'Storm'],
];

function rivalCarName(rand: () => number): string {
  const first = CAR_NAME_PARTS[0][Math.floor(rand() * CAR_NAME_PARTS[0].length)];
  const second = CAR_NAME_PARTS[1][Math.floor(rand() * CAR_NAME_PARTS[1].length)];
  return `${first} ${second}`;
}
