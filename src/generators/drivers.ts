import type { Driver, PersonalityTag, CarArchetype, CrewId } from '../types/game';
import { createPRNG } from '../engine/prng';

const FIRST_NAMES = [
  'Ryo', 'Kei', 'Sora', 'Yuki', 'Hana', 'Takeshi', 'Akira', 'Mika', 'Jun', 'Ren',
  'Marco', 'Luca', 'Sofia', 'Enzo', 'Rosa', 'Nico', 'Elena', 'Dante', 'Bianca', 'Gio',
  'Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Blake', 'Drew', 'Skyler', 'Reese',
  'Samir', 'Zara', 'Kiran', 'Priya', 'Dev', 'Amara', 'Ravi', 'Leila', 'Tariq', 'Noor',
];

const LAST_NAMES = [
  'Tanaka', 'Sato', 'Watanabe', 'Nakamura', 'Kobayashi', 'Miyamoto', 'Fujimoto', 'Ishida',
  'Rossi', 'Conti', 'Marino', 'Ferretti', 'Bellini', 'Rinaldi', 'Esposito', 'Greco',
  'Chen', 'Park', 'Kim', 'Nguyen', 'Tran', 'Singh', 'Patel', 'Adebayo', 'Owusu', 'Silva',
  'Cruz', 'Torres', 'Reyes', 'Rivera', 'Vega', 'Castro', 'Diaz', 'Morales',
];

const NICKNAMES = [
  'Ghost', 'Razor', 'Spark', 'Zero', 'Dash', 'Flicker', 'Shade', 'Wraith',
  'Bolt', 'Drift', 'Rook', 'Cipher', 'Ace', 'Talon', 'Hex', 'Jinx',
  'Vice', 'Hawk', 'Nova', 'Rust', 'Fuse', 'Echo', 'Flux', 'Void',
];

const PERSONALITIES: PersonalityTag[] = [
  'calm-hand', 'cowboy', 'showman', 'lone-wolf', 'ghost',
  'veteran', 'hothead', 'tinker', 'local', 'hungry', 'burnout',
];

const BACKSTORY_FRAGMENTS = [
  ['grew up', 'in a garage', 'with a wrench in hand'],
  ['used to run', 'courier jobs', 'across the city at midnight'],
  ['learned to drive', 'on mountain switchbacks', 'before getting a license'],
  ['quit their day job', 'at a parts shop', 'to chase the circuit'],
  ['owes everything', 'to a mentor who disappeared', 'after one last race'],
  ['was a mechanic', 'for a rival crew', 'before they were betrayed'],
  ['started racing', 'to pay off a debt', 'that only got bigger'],
  ['lost their first car', 'in a pink-slip race', 'and swore never again'],
  ['grew up watching', 'street races from a rooftop', 'dreaming of asphalt'],
  ['was a navigator', 'in the rally circuit', 'before switching to driver'],
  ['inherited a rusted-out chassis', 'from their older sibling', 'and built it back from nothing'],
  ['ran deliveries', 'through hostile territory', 'and never got caught'],
];

const MIDDLE_OPTIONS = [
  'after hours',
  'between shifts',
  'when no one was watching',
  'under sodium lights',
  'in the rain',
  'with a trunk full of parts',
  'on borrowed tires',
  'against better judgment',
];

export function generateDriver(
  seed: number,
  crewId: CrewId,
  archetype: CarArchetype,
  personality?: PersonalityTag,
): Driver {
  const rand = createPRNG(seed);

  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
  const nicknameRoll = rand();
  const nickname = nicknameRoll < 0.6 ? NICKNAMES[Math.floor(rand() * NICKNAMES.length)] : '';
  const pers = personality || PERSONALITIES[Math.floor(rand() * PERSONALITIES.length)];

  // Build backstory from fragments
  const fragment = BACKSTORY_FRAGMENTS[Math.floor(rand() * BACKSTORY_FRAGMENTS.length)];
  const middle = nicknameRoll > 0.4
    ? MIDDLE_OPTIONS[Math.floor(rand() * MIDDLE_OPTIONS.length)]
    : '';
  const backstory = middle
    ? `${fragment[0]} ${fragment[1]} ${middle} ${fragment[2]}.`
    : `${fragment[0]} ${fragment[1]} ${fragment[2]}.`;

  // Stats biased by personality and archetype
  const baseSpeed = 30 + Math.floor(rand() * 40);
  const baseControl = 30 + Math.floor(rand() * 40);
  const baseAggression = 30 + Math.floor(rand() * 40);
  const baseReputation = 10 + Math.floor(rand() * 30);

  // Personality adjustments
  let speed = baseSpeed;
  let control = baseControl;
  let aggression = baseAggression;
  let reputation = baseReputation;

  switch (pers) {
    case 'calm-hand': control += 15; aggression -= 10; break;
    case 'cowboy': speed += 10; aggression += 10; control -= 5; break;
    case 'showman': reputation += 15; speed += 5; control -= 5; break;
    case 'lone-wolf': speed += 15; reputation -= 10; break;
    case 'ghost': control += 10; reputation += 5; speed -= 5; break;
    case 'veteran': control += 10; reputation += 10; speed -= 5; aggression -= 5; break;
    case 'hothead': aggression += 20; control -= 10; break;
    case 'tinker': control += 10; speed += 5; aggression -= 5; break;
    case 'local': reputation += 10; control += 5; speed -= 5; break;
    case 'hungry': aggression += 10; speed += 10; reputation -= 5; control -= 5; break;
    case 'burnout': aggression += 15; speed += 5; control -= 10; reputation -= 10; break;
    case 'loyal': reputation += 10; control += 5; break;
  }

  // Clamp stats
  speed = Math.min(100, Math.max(10, speed));
  control = Math.min(100, Math.max(10, control));
  aggression = Math.min(100, Math.max(10, aggression));
  reputation = Math.min(100, Math.max(5, reputation));

  return {
    id: `driver-${crewId}-${seed}`,
    name: `${first} ${last}`,
    nickname,
    backstory,
    stats: { speed, control, aggression, reputation },
    personality: pers,
    loyalty: 40 + Math.floor(rand() * 30),
    carPreference: archetype,
    rivalries: [],
    crewId,
    history: [],
    isSignature: false,
  };
}

/** Generate a batch of drivers for a crew */
export function generateCrewDrivers(
  crewId: CrewId,
  count: number,
  archetype: CarArchetype,
  baseSeed: number = Date.now(),
): Driver[] {
  return Array.from({ length: count }, (_, i) =>
    generateDriver(baseSeed + i, crewId, archetype)
  );
}
