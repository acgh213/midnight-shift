// Generator stubs — procedural content creation
// Each generator is a pure function that produces content from a seed + inputs.

import type { Driver, PersonalityTag, CarArchetype, CrewId } from '../types/game';

/**
 * Generate a rank-and-file driver.
 * seed ensures determinism for replay/sharing.
 */
export function generateDriver(
  seed: number,
  crewId: CrewId,
  archetype: CarArchetype,
  personality?: PersonalityTag,
): Driver {
  // Placeholder — returns a bare-minimum driver
  return {
    id: `driver-${seed}`,
    name: `Driver ${seed}`,
    nickname: '',
    backstory: 'A driver looking for a crew.',
    stats: { speed: 50, control: 50, aggression: 50, reputation: 30 },
    personality: personality || 'calm-hand',
    loyalty: 50,
    carPreference: archetype,
    rivalries: [],
    crewId,
    history: [],
    isSignature: false,
  };
}
