import type { Driver, Crew, Car } from '../../types/game';

export const octaviaReine: Driver = {
  id: 'octavia-reine',
  name: 'Octavia Reine',
  nickname: 'Velvet',
  backstory: 'Heiress to a casino empire who decided racing was more interesting than board meetings. Funds her crew personally and expects loyalty in return.',
  stats: { speed: 70, control: 75, aggression: 50, reputation: 95 },
  personality: 'showman',
  loyalty: 80,
  carPreference: 'euro-precision',
  rivalries: ['mireille-vance', 'the-curator'],
  crewId: 'velvet-cartel',
  history: [],
  isSignature: true,
};

export const velvetCartelCrew: Crew = {
  id: 'velvet-cartel',
  name: 'Velvet Cartel',
  leaderId: 'octavia-reine',
  drivers: ['octavia-reine'],
  cars: ['roulette'],
  homeDistrict: 'strip',
  rep: 70,
  cash: 5000,
};

export const roulette: Car = {
  id: 'roulette',
  name: 'Roulette',
  archetype: 'euro-precision',
  class: 'S',
  stats: { topSpeed: 90, control: 85, aggression: 40, durability: 55 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 95,
  cosmetics: { paint: '#8b0000', decals: [], neonColor: '#ff2d95', bodyKit: '', plate: 'CARTEL-1' },
  isSignature: true,
  ownerId: 'velvet-cartel',
  assignedDriverId: 'octavia-reine',
};
