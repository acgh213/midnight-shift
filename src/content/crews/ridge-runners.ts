import type { Driver, Crew, Car } from '../../types/game';

export const anyaVey: Driver = {
  id: 'anya-vey',
  name: 'Anya Vey',
  nickname: 'Switchback',
  backstory: 'Daughter of a mountain rescue driver. Learned to drive on fire roads before she had a license. Finds the fog comforting.',
  stats: { speed: 65, control: 85, aggression: 60, reputation: 55 },
  personality: 'ghost',
  loyalty: 90,
  carPreference: 'rally-hybrid',
  rivalries: ['kaito-mori', 'the-curator'],
  crewId: 'ridge-runners',
  history: [],
  isSignature: true,
};

export const ridgeRunnersCrew: Crew = {
  id: 'ridge-runners',
  name: 'Ridge Runners',
  leaderId: 'anya-vey',
  drivers: ['anya-vey'],
  cars: ['fog-cutter'],
  homeDistrict: 'mountain',
  rep: 45,
  cash: 2200,
};

export const fogCutter: Car = {
  id: 'fog-cutter',
  name: 'Fog Cutter',
  archetype: 'rally-hybrid',
  class: 'B',
  stats: { topSpeed: 60, control: 90, aggression: 55, durability: 80 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 92,
  cosmetics: { paint: '#2d5a27', decals: [], neonColor: '#ffb800', bodyKit: '', plate: 'RIDGE-1' },
  isSignature: true,
  ownerId: 'ridge-runners',
  assignedDriverId: 'anya-vey',
};
