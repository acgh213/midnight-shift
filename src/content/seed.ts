import type { GameState } from '../types/game';
import {
  dieselMarquez, ironDogsCrew, hellbender,
  mireilleVance, glassTigersCrew, silverNeedle,
  kaitoMori, saltDevilsCrew, tsunamiRX,
  anyaVey, ridgeRunnersCrew, fogCutter,
  theCurator, hollowMenCrew, echoChamber,
  octaviaReine, velvetCartelCrew, roulette,
} from './crews';

/**
 * Seed the default game state with crew leader content.
 * Mutates the state in place and returns it.
 */
export function seedContent(state: GameState): GameState {
  // Drivers
  state.drivers = {
    'diesel-marquez': dieselMarquez,
    'mireille-vance': mireilleVance,
    'kaito-mori': kaitoMori,
    'anya-vey': anyaVey,
    'the-curator': theCurator,
    'octavia-reine': octaviaReine,
  };

  // Cars
  state.cars = {
    'hellbender': hellbender,
    'silver-needle': silverNeedle,
    'tsunami-rx': tsunamiRX,
    'fog-cutter': fogCutter,
    'echo-chamber': echoChamber,
    'roulette': roulette,
  };

  // Update rival crews with their drivers and cars
  state.crews = {
    ...state.crews,
    'iron-dogs': { ...ironDogsCrew, drivers: ['diesel-marquez'], cars: ['hellbender'] },
    'glass-tigers': { ...glassTigersCrew, drivers: ['mireille-vance'], cars: ['silver-needle'] },
    'salt-devils': { ...saltDevilsCrew, drivers: ['kaito-mori'], cars: ['tsunami-rx'] },
    'ridge-runners': { ...ridgeRunnersCrew, drivers: ['anya-vey'], cars: ['fog-cutter'] },
    'hollow-men': { ...hollowMenCrew, drivers: ['the-curator'], cars: ['echo-chamber'] },
    'velvet-cartel': { ...velvetCartelCrew, drivers: ['octavia-reine'], cars: ['roulette'] },
  };

  return state;
}
