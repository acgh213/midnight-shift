// ============================================================
// Midnight Shift — Core Type Definitions
// ============================================================

// --- Districts ---

export type DistrictId =
  | 'industrial'
  | 'downtown'
  | 'coastal'
  | 'mountain'
  | 'underground'
  | 'strip';

export interface District {
  id: DistrictId;
  name: string;
  vibe: string;
  roadType: string;
  hazardList: string[];
  perk: DistrictPerk;
  controlPercent: number; // 0–100, yours vs rival
  rivalCrewId: CrewId;
}

export interface DistrictPerk {
  name: string;
  description: string;
  effect: PerkEffect;
}

export interface PerkEffect {
  type: 'parts_cost' | 'garage_slot' | 'top_speed' | 'wear_rate' | 'recruit_cost' | 'rep_multiplier';
  value: number;
}

// --- Crews ---

export type CrewId =
  | 'iron-dogs'
  | 'glass-tigers'
  | 'salt-devils'
  | 'ridge-runners'
  | 'hollow-men'
  | 'velvet-cartel'
  | 'player';

export interface Crew {
  id: CrewId;
  name: string;
  leaderId: string;
  drivers: string[]; // driver IDs
  cars: string[]; // car IDs
  homeDistrict: DistrictId;
  rep: number;
  cash: number;
}

// --- Drivers ---

export type PersonalityTag =
  | 'calm-hand'
  | 'cowboy'
  | 'showman'
  | 'lone-wolf'
  | 'ghost'
  | 'veteran'
  | 'hothead'
  | 'tinker'
  | 'local'
  | 'loyal'
  | 'hungry'
  | 'burnout';

export interface Driver {
  id: string;
  name: string;
  nickname: string;
  backstory: string;
  stats: DriverStats;
  personality: PersonalityTag;
  loyalty: number; // 0–100
  carPreference: CarArchetype;
  rivalries: string[]; // driver IDs
  crewId: CrewId;
  history: RaceResult[];
  isSignature: boolean;
  nightsRemaining?: number; // for Burnout tag
}

export interface DriverStats {
  speed: number; // 0–100
  control: number; // 0–100
  aggression: number; // 0–100
  reputation: number; // 0–100
}

// --- Cars ---

export type CarArchetype =
  | 'jdm-tuner'
  | 'euro-precision'
  | 'american-muscle'
  | 'kei-special'
  | 'rally-hybrid';

export type CarClass = 'C' | 'B' | 'A' | 'S';

export interface Car {
  id: string;
  name: string;
  archetype: CarArchetype;
  class: CarClass;
  stats: CarStats;
  parts: Parts;
  condition: number; // 0–100
  cosmetics: CarCosmetics;
  isSignature: boolean;
  ownerId: CrewId;
  assignedDriverId: string | null;
}

export interface CarStats {
  topSpeed: number;
  control: number;
  aggression: number;
  durability: number;
}

export interface Parts {
  engine: Part | null;
  tires: Part | null;
  suspension: Part | null;
  nitro: Part | null;
  aero: Part | null;
}

export interface Part {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  statBonus: Partial<CarStats>;
  sideEffect?: string;
}

export interface CarCosmetics {
  paint: string;
  decals: string[];
  neonColor: string;
  bodyKit: string;
  plate: string;
}

// --- Races ---

export type RaceLength = '5m' | '30m' | '4h' | '8h';
export type Stakes = 'low' | 'mid' | 'high' | 'boss';
export type Posture = 'safe' | 'push' | 'reckless';

export interface RaceSetup {
  id: string;
  districtId: DistrictId;
  stakes: Stakes;
  posture: Posture;
  length: RaceLength;
  playerCarIds: string[];
  playerDriverIds: string[];
  rivalCarIds: string[];
  rivalDriverIds: string[];
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  seed: number;
}

export interface RaceResult {
  raceId: string;
  outcome: 'win' | 'loss' | 'draw';
  position: number;
  finishTime: number;
  events: RaceEvent[];
  rewards: RaceRewards;
  driverStatChanges: Record<string, Partial<DriverStats>>;
  districtControlChange: number;
}

export interface RaceEvent {
  tick: number;
  type: 'OVERTAKE' | 'NEAR_MISS' | 'CRASH_RECOVER' | 'MECHANICAL' | 'FINISH' | 'CRASH_OUT';
  drivers: string[]; // involved driver IDs
  severity: number; // 0–100
  location: string; // track region name
}

export interface RaceRewards {
  cash: number;
  rep: number;
  parts: Part[];
  info: number;
}

// --- Economy ---

export interface PlayerEconomy {
  cash: number;
  rep: number;
  info: number;
  parts: Part[];
}

// --- Game State ---

export type PlayerPath = 'racer' | 'boss';

export type ScreenId =
  | 'city-map'
  | 'garage'
  | 'car-detail'
  | 'car-market'
  | 'crew-roster'
  | 'driver-detail'
  | 'customization'
  | 'race-setup'
  | 'race-live'
  | 'race-highlights'
  | 'message-board'
  | 'junkyard'
  | 'midnight-garage'
  | 'path-select'
  | 'prestige'
  | 'settings';

export interface GameState {
  version: number;
  night: number;
  playerPath: PlayerPath;
  playerCrewId: 'player';
  economy: PlayerEconomy;
  crews: Record<CrewId, Crew>;
  drivers: Record<string, Driver>;
  cars: Record<string, Car>;
  districts: Record<DistrictId, District>;
  activeRaces: RaceSetup[];
  completedRaceIds: string[];
  raceResults: Record<string, RaceResult>;
  prestigeCarryover: PrestigeCarryover;
  unlockedTunes: Tune[];
  settings: GameSettings;
  hardcoreMode: boolean;
  nightStartTime: number;
  lastSaveTime: number;
  recentEvents: GameEvent[];
  specialEvents: SpecialEvent[];
}

export interface PrestigeCarryover {
  garageSlots: number;
  startingCashFloor: number;
  repMultiplier: number;
  signatureDriverKept: string | null; // driver ID
  permanentUnlocks: string[];
}

export interface Tune {
  id: string;
  name: string;
  parts: Parts;
  archetype: CarArchetype;
}

export interface GameSettings {
  crtScanlines: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

// --- Message Board ---

export interface MessageBoardPost {
  id: string;
  handle: string;
  timestamp: number;
  content: string;
  district?: DistrictId;
  eventType: 'race_result' | 'drama' | 'challenge' | 'rumor' | 'crew_news';
  tags: string[];
}

// --- Game Events ---

export interface GameEvent {
  id: string;
  type: 'challenge' | 'upgrade' | 'recruit' | 'poach' | 'taunt';
  crewId: CrewId;
  crewName: string;
  description: string;
  timestamp: number;
  districtId?: string;
}

export type SpecialEventType =
  | 'midnight_tournament'
  | 'police_crackdown'
  | 'street_takeover'
  | 'parts_shipment'
  | 'crew_war'
  | 'wangan_run';

export interface SpecialEvent {
  id: string;
  type: SpecialEventType;
  title: string;
  description: string;
  districtId: DistrictId;
  districtName: string;
  timestamp: number;
  expiresAt: number;
  rewards: { cash: number; rep: number; info: number };
  risk: 'low' | 'medium' | 'high';
  autoResolve: boolean;
  resolved: boolean;
  result?: string;
}

// --- Prestige ---

export interface PrestigeOptions {
  currentNight: number;
  carryover: PrestigeCarryover;
  availableDrivers: string[]; // driver IDs eligible to keep
  scalingPreview: {
    rivalStatIncrease: number;
    newUnlocks: string[];
    districtChanges: string;
  };
}
