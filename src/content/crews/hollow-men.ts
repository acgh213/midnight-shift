import type { Driver, Crew, Car } from '../../types/game';

export const theCurator: Driver = {
  id: 'the-curator',
  name: 'The Curator',
  nickname: '',
  backstory: 'No one knows their real name. Runs the underground circuit from a decommissioned subway station. Collects secrets like others collect cars.',
  stats: { speed: 60, control: 70, aggression: 80, reputation: 85 },
  personality: 'ghost',
  loyalty: 95,
  carPreference: 'kei-special',
  rivalries: ['octavia-reine', 'anya-vey'],
  crewId: 'hollow-men',
  history: [],
  isSignature: true,
};

export const hollowMenCrew: Crew = {
  id: 'hollow-men',
  name: 'Hollow Men',
  leaderId: 'the-curator',
  drivers: ['the-curator'],
  cars: ['echo-chamber'],
  homeDistrict: 'underground',
  rep: 55,
  cash: 2800,
};

export const echoChamber: Car = {
  id: 'echo-chamber',
  name: 'Echo Chamber',
  archetype: 'kei-special',
  class: 'B',
  stats: { topSpeed: 55, control: 85, aggression: 75, durability: 70 },
  parts: { engine: null, tires: null, suspension: null, nitro: null, aero: null },
  condition: 80,
  cosmetics: { paint: '#1a1a1a', decals: [], neonColor: '#b347ea', bodyKit: '', plate: 'HOLLOW-1' },
  isSignature: true,
  ownerId: 'hollow-men',
  assignedDriverId: 'the-curator',
};
