import type { Crew, District, DistrictId } from '../types/game';

export interface BossVision {
  districtId: DistrictId;
  rivalCrewId: string;
  heatLevel: number;       // 0-100, how actively the rival is targeting this district
  nextChallengeIn: number; // hours until rival challenges
  rivalUpgrading: boolean; // rival is currently upgrading a car
  poachTarget: string | null; // driver ID the rival might try to poach
}

/**
 * Generate Boss Vision data from current game state.
 * Boss path players see this overlay on the City Map.
 */
export function generateBossVision(
  crews: Record<string, Crew>,
  districts: Record<DistrictId, District>,
  _playerRep: number,
  _night: number,
): BossVision[] {
  return Object.values(districts).map((d) => {
    const rival = crews[d.rivalCrewId];
    const heat = Math.min(100, 20 + rival.rep * 0.5 + Math.floor(Math.random() * 30));
    const challengeIn = Math.max(0.5, 24 - heat * 0.2);

    return {
      districtId: d.id,
      rivalCrewId: d.rivalCrewId,
      heatLevel: heat,
      nextChallengeIn: Math.round(challengeIn * 10) / 10,
      rivalUpgrading: Math.random() > 0.7,
      poachTarget: Math.random() > 0.8 ? 'pending' : null,
    };
  });
}

/**
 * Apply Boss path recruitment discount.
 * Stacks with Underground district control perk.
 */
export function bossRecruitDiscount(baseCost: number, hasUndergroundPerk: boolean): number {
  let discount = 0.2; // base 20% boss discount
  if (hasUndergroundPerk) discount += 0.2; // +20% from Underground
  return Math.round(baseCost * (1 - discount));
}

/**
 * Apply Racer path signature driver stat bonus.
 */
export function racerSignatureBonus(baseStats: { speed: number; control: number; aggression: number; reputation: number }) {
  return {
    speed: Math.min(100, baseStats.speed + 10),
    control: Math.min(100, baseStats.control + 10),
    aggression: Math.min(100, baseStats.aggression + 10),
    reputation: Math.min(100, baseStats.reputation + 10),
  };
}

/**
 * Calculate crew order income for Boss path.
 * Send idle drivers on solo missions for passive cash.
 */
export function crewOrderIncome(driverCount: number, driverQuality: number): number {
  // driverQuality = average of all stats of idle drivers / 100
  return Math.round(driverCount * 50 * (0.5 + driverQuality * 0.5));
}
