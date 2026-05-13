import type { Driver, Crew, Car } from '../../types/game';

export const mireilleVance: Driver = {
  id: 'mireille-vance',
  name: 'Mireille Vance',
  nickname: 'Glass Knife',
  backstory: 'Ex-rally navigator who traded co-driver notes for a steering wheel. Prefers precision over power — and rarely loses a line.',
  stats: { speed: 75, control: 90, aggression: 40, reputation: 80 },
  personality: 'calm-hand',
  loyalty: 90,
  carPreference: 'euro-precision',
  rivalries: ['diesel-marquez', 'octavia-reine'],
  crewId: 'glass-tigers',
  history: [],
  isSignature: true,
};

export const glassTigersCrew: Crew = {
  id: 'glass-tigers',
  name: 'Glass Tigers',
  leaderId: 'mireille-vance',
  drivers: ['mireille-vance'],
  cars: ['silver-needle'],
  homeDistrict: 'downtown',
  rep: 60,
  cash: 3000,
};

export const silverNeedle: Car = {
  id: 'silver-needle',
  name: 'Silver Needle',
  archetype: 'euro-precision',
  class: 'A',
  stats: { topSpeed: 80, control: 95, aggression: 30, durability: 60 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 90,
  cosmetics: { paint: '#c0c0c0', decals: [], neonColor: '#00d4ff', bodyKit: '', plate: 'GLASS-1' },
  isSignature: true,
  ownerId: 'glass-tigers',
  assignedDriverId: 'mireille-vance',
};
