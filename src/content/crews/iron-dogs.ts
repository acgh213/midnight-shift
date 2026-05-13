import type { Driver, Crew, Car } from '../../types/game';

export const dieselMarquez: Driver = {
  id: 'diesel-marquez',
  name: 'Diesel Marquez',
  nickname: 'The Wall',
  backstory: 'Former dock worker who built his first engine from salvage. Won the industrial district in a single night, street by street.',
  stats: { speed: 55, control: 65, aggression: 85, reputation: 70 },
  personality: 'veteran',
  loyalty: 95,
  carPreference: 'american-muscle',
  rivalries: ['mireille-vance'],
  crewId: 'iron-dogs',
  history: [],
  isSignature: true,
};

export const ironDogsCrew: Crew = {
  id: 'iron-dogs',
  name: 'Iron Dogs',
  leaderId: 'diesel-marquez',
  drivers: ['diesel-marquez'],
  cars: ['hellbender'],
  homeDistrict: 'industrial',
  rep: 40,
  cash: 2000,
};

export const hellbender: Car = {
  id: 'hellbender',
  name: 'Hellbender',
  archetype: 'american-muscle',
  class: 'A',
  stats: { topSpeed: 70, control: 45, aggression: 90, durability: 85 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 85,
  cosmetics: { paint: '#b22222', decals: [], neonColor: '#ff4400', bodyKit: '', plate: 'IRON-1' },
  isSignature: true,
  ownerId: 'iron-dogs',
  assignedDriverId: 'diesel-marquez',
};
