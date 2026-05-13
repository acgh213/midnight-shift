// Web Worker for race simulation
// Receives simulation requests, runs them off the main thread,
// posts results back.

import { simulateRace, simulateOfflineRaces } from '../engine/simulator';

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SIMULATE_RACE': {
      const { race, drivers, cars, district } = payload;
      const result = simulateRace(race, drivers, cars, district);
      self.postMessage({ type: 'RACE_RESULT', payload: result });
      break;
    }
    case 'SIMULATE_OFFLINE': {
      const { races, drivers, cars, districts } = payload;
      const results = simulateOfflineRaces(races, drivers, cars, districts);
      self.postMessage({ type: 'OFFLINE_RESULTS', payload: results });
      break;
    }
    default:
      console.warn('Unknown worker message type:', type);
  }
};

export {};
