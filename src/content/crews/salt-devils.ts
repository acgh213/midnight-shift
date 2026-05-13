import type { Driver, Crew, Car } from '../../types/game';

export const kaitoMori: Driver = {
  id: 'kaito-mori',
  name: 'Kaito Mori',
  nickname: 'Salt Wind',
  backstory: 'Grew up in a fishing village tuning outboard motors. Discovered highway racing at 16 and never looked back — the ocean taught him patience, the road taught him speed.',
  stats: { speed: 90, control: 60, aggression: 55, reputation: 65 },
  personality: 'lone-wolf',
  loyalty: 85,
  carPreference: 'jdm-tuner',
  rivalries: ['anya-vey'],
  crewId: 'salt-devils',
  history: [],
  isSignature: true,
};

export const saltDevilsCrew: Crew = {
  id: 'salt-devils',
  name: 'Salt Devils',
  leaderId: 'kaito-mori',
  drivers: ['kaito-mori'],
  cars: ['tsunami-rx'],
  homeDistrict: 'coastal',
  rep: 50,
  cash: 2500,
};

export const tsunamiRX: Car = {
  id: 'tsunami-rx',
  name: 'Tsunami RX',
  archetype: 'jdm-tuner',
  class: 'A',
  stats: { topSpeed: 95, control: 55, aggression: 60, durability: 65 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 88,
  cosmetics: { paint: '#0066cc', decals: [], neonColor: '#00d4ff', bodyKit: '', plate: 'SALT-1' },
  isSignature: true,
  ownerId: 'salt-devils',
  assignedDriverId: 'kaito-mori',
};
