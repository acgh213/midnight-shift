import type { GameState } from '../types/game';
import { seedContent } from '../content/seed';

export function getDefaultGameState(): GameState {
  const state: GameState = {
    version: 1,
    night: 1,
    playerPath: 'racer',
    playerCrewId: 'player',
    economy: { cash: 500, rep: 0, info: 0, parts: [] },
    crews: {
      player: {
        id: 'player',
        name: 'Midnight Shift',
        leaderId: '',
        drivers: [],
        cars: [],
        homeDistrict: 'industrial',
        rep: 0,
        cash: 500,
      },
      'iron-dogs': {
        id: 'iron-dogs', name: 'Iron Dogs', leaderId: 'diesel-marquez',
        drivers: [], cars: [], homeDistrict: 'industrial', rep: 40, cash: 2000,
      },
      'glass-tigers': {
        id: 'glass-tigers', name: 'Glass Tigers', leaderId: 'mireille-vance',
        drivers: [], cars: [], homeDistrict: 'downtown', rep: 60, cash: 3000,
      },
      'salt-devils': {
        id: 'salt-devils', name: 'Salt Devils', leaderId: 'kaito-mori',
        drivers: [], cars: [], homeDistrict: 'coastal', rep: 50, cash: 2500,
      },
      'ridge-runners': {
        id: 'ridge-runners', name: 'Ridge Runners', leaderId: 'anya-vey',
        drivers: [], cars: [], homeDistrict: 'mountain', rep: 45, cash: 2200,
      },
      'hollow-men': {
        id: 'hollow-men', name: 'Hollow Men', leaderId: 'the-curator',
        drivers: [], cars: [], homeDistrict: 'underground', rep: 55, cash: 2800,
      },
      'velvet-cartel': {
        id: 'velvet-cartel', name: 'Velvet Cartel', leaderId: 'octavia-reine',
        drivers: [], cars: [], homeDistrict: 'strip', rep: 70, cash: 5000,
      },
    },
    drivers: {},
    cars: {},
    districts: {
      industrial: {
        id: 'industrial', name: 'Industrial District',
        vibe: 'Warehouses, shipping containers, empty lots',
        roadType: 'Tight corners, debris hazards',
        hazardList: ['debris', 'blind corners', 'loose gravel'],
        perk: { name: 'Scrap Discount', description: 'Parts cost −10%', effect: { type: 'parts_cost', value: -10 } },
        controlPercent: 0, rivalCrewId: 'iron-dogs',
      },
      downtown: {
        id: 'downtown', name: 'Downtown',
        vibe: 'Skyscrapers, parking garages, neon canyons',
        roadType: 'Grid streets, traffic weaving',
        hazardList: ['traffic', 'gridlock', 'pedestrians'],
        perk: { name: 'Extra Bay', description: '+1 garage slot', effect: { type: 'garage_slot', value: 1 } },
        controlPercent: 0, rivalCrewId: 'glass-tigers',
      },
      coastal: {
        id: 'coastal', name: 'Coastal Highway',
        vibe: 'Ocean on one side, cliffs on the other',
        roadType: 'Long straights, sweeping curves',
        hazardList: ['crosswinds', 'wet pavement', 'cliff edge'],
        perk: { name: 'Salt Breeze', description: 'Top-speed cap +5%', effect: { type: 'top_speed', value: 5 } },
        controlPercent: 0, rivalCrewId: 'salt-devils',
      },
      mountain: {
        id: 'mountain', name: 'Mountain Pass',
        vibe: 'Winding roads, fog, guardrails',
        roadType: 'Hairpins, elevation changes',
        hazardList: ['fog', 'guardrails', 'falling rocks', 'ice patches'],
        perk: { name: 'Tough Tires', description: 'Wear rate −15%', effect: { type: 'wear_rate', value: -15 } },
        controlPercent: 0, rivalCrewId: 'ridge-runners',
      },
      underground: {
        id: 'underground', name: 'Underground',
        vibe: 'Tunnels, subway access, drainage',
        roadType: 'No visibility, echo, tight',
        hazardList: ['darkness', 'water', 'debris', 'narrow passages'],
        perk: { name: 'Word of Mouth', description: 'Recruit cost −20%', effect: { type: 'recruit_cost', value: -20 } },
        controlPercent: 0, rivalCrewId: 'hollow-men',
      },
      strip: {
        id: 'strip', name: 'The Strip',
        vibe: 'Clubs, casinos, tourist traps',
        roadType: 'Wide boulevards, traffic, cops',
        hazardList: ['traffic', 'police', 'tourists', 'valet lanes'],
        perk: { name: 'Star Power', description: 'Rep multiplier +10%', effect: { type: 'rep_multiplier', value: 10 } },
        controlPercent: 0, rivalCrewId: 'velvet-cartel',
      },
    },
    activeRaces: [],
    completedRaceIds: [],
    raceResults: {},
    prestigeCarryover: {
      garageSlots: 2,
      startingCashFloor: 200,
      repMultiplier: 1.0,
      signatureDriverKept: null,
      permanentUnlocks: [],
    },
    unlockedTunes: [],
    settings: {
      crtScanlines: false,
      soundEnabled: true,
      musicVolume: 50,
      sfxVolume: 80,
    },
    hardcoreMode: false,
    nightStartTime: Date.now(),
    lastSaveTime: Date.now(),
    recentEvents: [],
    specialEvents: [],
  };

  return seedContent(state);
}
