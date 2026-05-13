import type { GameState } from '../types/game';
import {
  dieselMarquez, ironDogsCrew, hellbender,
  mireilleVance, glassTigersCrew, silverNeedle,
  kaitoMori, saltDevilsCrew, tsunamiRX,
  anyaVey, ridgeRunnersCrew, fogCutter,
  theCurator, hollowMenCrew, echoChamber,
  octaviaReine, velvetCartelCrew, roulette,
} from './crews';
import { generateDriver } from '../generators/drivers';

/** Give the player a starter car so they aren't deadlocked. */
const STARTER_CAR = {
  id: 'midnight-sparrow',
  name: 'Midnight Sparrow',
  archetype: 'jdm-tuner' as const,
  class: 'C' as const,
  stats: { topSpeed: 60, control: 65, aggression: 45, durability: 70 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 100,
  cosmetics: { paint: '#ffff00', decals: [], neonColor: '', bodyKit: '', plate: '' },
  isSignature: false,
  ownerId: 'player' as const,
  assignedDriverId: null,
};

/**
 * Seed the default game state with crew leader content
 * and give the player a starter driver + car.
 * Mutates the state in place and returns it.
 */
export function seedContent(state: GameState): GameState {
  // Generate starter driver for the player crew
  const starterDriver = generateDriver(42, 'player', 'jdm-tuner', 'hungry');

  // Drivers — rivals + player starter
  state.drivers = {
    'diesel-marquez': dieselMarquez,
    'mireille-vance': mireilleVance,
    'kaito-mori': kaitoMori,
    'anya-vey': anyaVey,
    'the-curator': theCurator,
    'octavia-reine': octaviaReine,
    [starterDriver.id]: starterDriver,
  };

  // Cars — rivals + player starter
  state.cars = {
    'hellbender': hellbender,
    'silver-needle': silverNeedle,
    'tsunami-rx': tsunamiRX,
    'fog-cutter': fogCutter,
    'echo-chamber': echoChamber,
    'roulette': roulette,
    [STARTER_CAR.id]: STARTER_CAR,
  };

  // Update rival crews with their drivers and cars
  // Give the player their starter driver + car
  state.crews = {
    ...state.crews,
    'iron-dogs': { ...ironDogsCrew, drivers: ['diesel-marquez'], cars: ['hellbender'] },
    'glass-tigers': { ...glassTigersCrew, drivers: ['mireille-vance'], cars: ['silver-needle'] },
    'salt-devils': { ...saltDevilsCrew, drivers: ['kaito-mori'], cars: ['tsunami-rx'] },
    'ridge-runners': { ...ridgeRunnersCrew, drivers: ['anya-vey'], cars: ['fog-cutter'] },
    'hollow-men': { ...hollowMenCrew, drivers: ['the-curator'], cars: ['echo-chamber'] },
    'velvet-cartel': { ...velvetCartelCrew, drivers: ['octavia-reine'], cars: ['roulette'] },
    player: {
      ...state.crews.player,
      drivers: [starterDriver.id],
      cars: [STARTER_CAR.id],
    },
  };

  return state;
}
