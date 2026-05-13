import type { MessageBoardPost, RaceResult, Crew, Driver } from '../types/game';
import { createPRNG } from '../engine/prng';

const HANDLES = [
  'shifting_thru', 'neon_ghost', 'asphalt_oracle', 'clutch_kick_kid',
  'torque_talk', 'midnight_lurker', 'drift_dog_99', 'wanagan_watcher',
  'gearbox_gremlin', 'NOS_4_DINNER', 'curb_feeler', 'rev_limit_rita',
  'dump_pipe_dave', 'tire_wall_tim', 'tunnel_vision', 'redline_rat',
];

const DRAMA_TEMPLATES = [
  (handle: string, winner: string, loser: string) =>
    `${handle}: just saw ${winner} walk away from a race with ${loser}. ${loser} wouldn't even make eye contact. cold.`,

  (handle: string, crew: string) =>
    `${handle}: heard ${crew} is recruiting. if you can handle the initiation. most can't.`,

  (handle: string, district: string) =>
    `${handle}: three races in ${district} tonight and not a single cop. either they're busy or someone paid someone.`,

  (handle: string, driver: string) =>
    `${handle}: ${driver} been practicing on the mountain pass at 3am. saw the tire marks. clean lines though.`,

  (handle: string, crew1: string, crew2: string) =>
    `${handle}: word is ${crew1} and ${crew2} almost threw down at the junkyard. over a parts deal gone wrong.`,

  (handle: string, driver: string, car: string) =>
    `${handle}: ${driver} rolled up in a ${car} tonight. everyone acted unimpressed but you could hear the envy.`,

  (handle: string, district: string, crew: string) =>
    `${handle}: territory in ${district} is getting hot. ${crew} running extra patrols. something's coming.`,

  (handle: string, driver: string) =>
    `${handle}: unpopular opinion but ${driver} is underrated. give them a better car and watch what happens.`,

  (handle: string) =>
    `${handle}: wangan terminal was EMPTY tonight. just me, the ocean, and 200kph. recommend.`,

  (handle: string, crew: string) =>
    `${handle}: ${crew}'s leader hasn't been seen in days. either planning something big or skipping town. my money's on the former.`,
];

const CHALLENGE_TEMPLATES = [
  (handle: string, challenger: string, target: string, district: string) =>
    `${handle}: ${challenger} calling out ${target}. ${district}. midnight. bring your best or don't come.`,

  (handle: string, crew: string, district: string) =>
    `${handle}: any driver from ${crew} wanna prove something? ${district} tomorrow. I'll be waiting.`,

  (handle: string, driver: string, stakes: string) =>
    `${handle}: ${driver} wants a rematch. ${stakes} stakes this time. no backing out.`,
];

const RUMOR_TEMPLATES = [
  (handle: string, car: string) =>
    `${handle}: someone spotted a ${car} in the junkyard. engine still warm. finders keepers?`,

  (handle: string, part: string) =>
    `${handle}: parts dealer in the industrial district has ${part}. don't ask where they came from.`,

  (handle: string) =>
    `${handle}: cops setting up checkpoint on the coastal highway. take the long way.`,

  (handle: string, crew: string) =>
    `${handle}: rumor: ${crew} is sitting on a pile of cash. race winnings or something else?`,

  (handle: string) =>
    `${handle}: fog on the mountain pass is thicker than usual tonight. perfect for ghosts.`,

  (handle: string, district: string) =>
    `${handle}: ${district} roads got resurfaced. smoother than a casino table. enjoy it while it lasts.`,
];

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function getRandomDriverName(drivers: Record<string, Driver>, rand: () => number): string {
  const ids = Object.keys(drivers);
  if (ids.length === 0) return 'some driver';
  return drivers[ids[Math.floor(rand() * ids.length)]].name;
}

function getRandomCrewName(crews: Record<string, Crew>, excludePlayer: boolean, rand: () => number): string {
  const crewsList = Object.values(crews).filter((c) => !excludePlayer || c.id !== 'player');
  if (crewsList.length === 0) return 'some crew';
  return crewsList[Math.floor(rand() * crewsList.length)].name;
}

function getRandomDistrictName(rand: () => number): string {
  const districts = [
    'Industrial District', 'Downtown', 'Coastal Highway',
    'Mountain Pass', 'Underground', 'The Strip',
  ];
  return districts[Math.floor(rand() * districts.length)];
}

/**
 * Generate Message Board posts based on recent game events.
 */
export function generatePosts(
  seed: number,
  drivers: Record<string, Driver>,
  crews: Record<string, Crew>,
  recentResults: RaceResult[],
  count: number = 6,
): MessageBoardPost[] {
  const rand = createPRNG(seed);
  const posts: MessageBoardPost[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const handle = pickRandom(HANDLES, rand);
    const postTypeRoll = rand();

    let content: string;
    let eventType: MessageBoardPost['eventType'];
    let tags: string[] = [];

    if (recentResults.length > 0 && postTypeRoll < 0.3) {
      // Race result post
      const result = recentResults[Math.floor(rand() * recentResults.length)];
      const winnerName = result.driverStatChanges
        ? getRandomDriverName(drivers, rand)
        : 'someone';
      const loserName = getRandomCrewName(crews, false, rand);
      content = `${handle}: race just wrapped. ${winnerName} took it. ${loserName} crew is quiet tonight.`;
      eventType = 'race_result';
      tags = ['racing', result.outcome];
    } else if (postTypeRoll < 0.55) {
      // Drama post
      const template = pickRandom(DRAMA_TEMPLATES, rand);
      content = template(
        handle,
        getRandomDriverName(drivers, rand),
        getRandomCrewName(crews, false, rand)
      );
      eventType = 'drama';
      tags = ['drama', 'gossip'];
    } else if (postTypeRoll < 0.75) {
      // Challenge post
      const template = pickRandom(CHALLENGE_TEMPLATES, rand);
      const challenger = getRandomDriverName(drivers, rand);
      const target = getRandomCrewName(crews, false, rand);
      const district = getRandomDistrictName(rand);
      content = template(handle, challenger, target, district);
      eventType = 'challenge';
      tags = ['challenge', 'racing'];
    } else {
      // Rumor post
      const template = pickRandom(RUMOR_TEMPLATES, rand);
      content = template(handle, getRandomCrewName(crews, false, rand));
      eventType = 'rumor';
      tags = ['rumor', 'intel'];
    }

    posts.push({
      id: `post-${seed}-${i}`,
      handle,
      timestamp: now - Math.floor(rand() * 3600000),
      content,
      eventType,
      tags,
    });
  }

  // Sort newest first
  posts.sort((a, b) => b.timestamp - a.timestamp);
  return posts;
}

/** Generate welcome/first-visit posts */
export function generateWelcomePosts(): MessageBoardPost[] {
  const now = Date.now();

  return [
    {
      id: `welcome-1`,
      handle: 'board_mod',
      timestamp: now - 7200000,
      content: 'board_mod: new crew in town. Midnight Shift. let\'s see how long they last.',
      eventType: 'crew_news',
      tags: ['welcome', 'new crew'],
    },
    {
      id: `welcome-2`,
      handle: 'neon_ghost',
      timestamp: now - 3600000,
      content: 'neon_ghost: fresh meat on the asphalt. the iron dogs are already laughing. prove them wrong.',
      eventType: 'drama',
      tags: ['welcome', 'drama'],
    },
    {
      id: `welcome-3`,
      handle: 'asphalt_oracle',
      timestamp: now - 1800000,
      content: 'asphalt_oracle: every legend starts as a nobody with a fast car and something to prove. welcome to the night.',
      eventType: 'rumor',
      tags: ['welcome', 'wisdom'],
    },
  ];
}
