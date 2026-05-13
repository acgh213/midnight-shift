import type { GameState, DistrictId, SpecialEventType, SpecialEvent } from '../types/game';
import { createPRNG } from './prng';

let eventSeq = 0;

const EVENT_DESCRIPTIONS: Record<SpecialEventType, { title: string; desc: string; risk: 'low' | 'medium' | 'high'; autoResolve: boolean }> = {
  midnight_tournament: {
    title: 'Midnight Tournament',
    desc: 'Four crews, one bracket. Winner takes all. Registration closes at dawn.',
    risk: 'high',
    autoResolve: false,
  },
  police_crackdown: {
    title: 'Police Crackdown',
    desc: 'Cops are sweeping the district. Heat is up. Races here risk impound.',
    risk: 'medium',
    autoResolve: true,
  },
  street_takeover: {
    title: 'Street Takeover',
    desc: 'Spontaneous meet. Engines, music, and no cops — yet. Show up for free rep.',
    risk: 'low',
    autoResolve: false,
  },
  parts_shipment: {
    title: 'Parts Shipment',
    desc: 'A container just dropped. 30% off all parts for the next 6 hours.',
    risk: 'low',
    autoResolve: true,
  },
  crew_war: {
    title: 'Crew War',
    desc: 'A rival crew has declared war. Best of three races. Loser gives up a district.',
    risk: 'high',
    autoResolve: false,
  },
  wangan_run: {
    title: 'The Wangan Run',
    desc: 'Long highway. No turns. Pure top speed. Highest cash prize in the city.',
    risk: 'medium',
    autoResolve: false,
  },
};

/**
 * Generate special events that fire during idle time.
 * Called alongside rival AI in processIdleCatchup.
 */
export function generateSpecialEvents(
  state: GameState,
  elapsedHours: number,
  seed: number,
): SpecialEvent[] {
  const rand = createPRNG(seed);
  const events: SpecialEvent[] = [];

  // Events fire roughly every 4-8 hours of idle time
  const eventCount = Math.max(0, Math.floor(elapsedHours / 6) + (rand() > 0.6 ? 1 : 0));
  if (eventCount === 0) return events;

  const eventTypes: SpecialEventType[] = [
    'midnight_tournament', 'police_crackdown', 'street_takeover',
    'parts_shipment', 'crew_war', 'wangan_run',
  ];

  for (let i = 0; i < eventCount; i++) {
    const type = eventTypes[Math.floor(rand() * eventTypes.length)];
    const districtEntries = Object.entries(state.districts) as [DistrictId, typeof state.districts[DistrictId]][];
    const district = districtEntries[Math.floor(rand() * districtEntries.length)];
    const details = EVENT_DESCRIPTIONS[type];

    const now = Date.now();
    const expiresAt = now + (details.autoResolve ? 2 : 12) * 3600000; // 2h for auto, 12h for player action

    const rewardMultiplier = details.risk === 'high' ? 3 : details.risk === 'medium' ? 2 : 1;

    events.push({
      id: `event-${type}-${now}-${++eventSeq}`,
      type,
      title: details.title,
      description: details.desc,
      districtId: district[0],
      districtName: district[1].name,
      timestamp: now,
      expiresAt,
      rewards: {
        cash: 100 * rewardMultiplier + Math.floor(rand() * 200),
        rep: 10 * rewardMultiplier + Math.floor(rand() * 20),
        info: 3 * rewardMultiplier + Math.floor(rand() * 5),
      },
      risk: details.risk,
      autoResolve: details.autoResolve,
      resolved: false,
    });
  }

  return events;
}

/**
 * Resolve an event that the player isn't participating in (auto-resolve or expired).
 */
export function resolveEvent(event: SpecialEvent, _state: GameState): SpecialEvent {
  if (event.resolved) return event;

  const outcomes: string[] = [];

  switch (event.type) {
    case 'police_crackdown':
      outcomes.push('The heat died down. Streets are clear again.');
      break;
    case 'parts_shipment':
      outcomes.push('The shipment sold out. Prices are back to normal.');
      break;
    case 'street_takeover':
      outcomes.push('The meet dispersed at dawn. No cops showed.');
      break;
    case 'midnight_tournament':
      outcomes.push('Registration closed. Another crew took the bracket.');
      break;
    case 'wangan_run':
      outcomes.push('The run ended. Someone else took the prize.');
      break;
    case 'crew_war':
      outcomes.push('The war fizzled out. No territory changed hands.');
      break;
  }

  return {
    ...event,
    resolved: true,
    result: outcomes[0] || 'Event expired.',
  };
}

/**
 * Participate in a non-auto-resolve event (player chooses to engage).
 * Returns reward adjustments and a result string.
 */
export function participateInEvent(
  event: SpecialEvent,
  _state: GameState,
): { event: SpecialEvent; cashDelta: number; repDelta: number; infoDelta: number; result: string } {
  const rand = createPRNG(Date.now());
  const won = rand() > (event.risk === 'high' ? 0.5 : event.risk === 'medium' ? 0.35 : 0.2);

  let cashDelta = 0;
  let repDelta = 0;
  let infoDelta = 0;
  let result = '';

  switch (event.type) {
    case 'midnight_tournament':
      if (won) {
        cashDelta = event.rewards.cash;
        repDelta = event.rewards.rep;
        infoDelta = event.rewards.info;
        result = '🏆 You won the tournament! The city is talking.';
      } else {
        cashDelta = Math.floor(event.rewards.cash * 0.2);
        repDelta = Math.floor(event.rewards.rep * 0.3);
        result = 'Eliminated in the semi-finals. Respectable showing.';
      }
      break;

    case 'street_takeover':
      repDelta = event.rewards.rep;
      infoDelta = 2;
      result = 'You showed up. The street knows your name now.';
      break;

    case 'wangan_run':
      if (won) {
        cashDelta = event.rewards.cash * 2; // double cash for wangan
        repDelta = event.rewards.rep;
        result = '💨 Flat out. No one touched you. Wangan king.';
      } else {
        cashDelta = Math.floor(event.rewards.cash * 0.3);
        result = 'Fast, but not fast enough. The highway belongs to someone else tonight.';
      }
      break;

    case 'crew_war':
      if (won) {
        cashDelta = event.rewards.cash;
        repDelta = event.rewards.rep * 2;
        infoDelta = event.rewards.info;
        result = '⚔️ War won. The rival crew is licking their wounds.';
      } else {
        repDelta = -5;
        result = 'Lost the war. Territory weakened. Regroup.';
      }
      break;

    default:
      result = 'Event resolved.';
  }

  return {
    event: { ...event, resolved: true, result },
    cashDelta,
    repDelta,
    infoDelta: infoDelta || event.rewards.info,
    result,
  };
}
