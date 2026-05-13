import { useGameStore } from '../state/store';
import type { Crew, Driver, Car, District, CrewId } from '../types/game';

export function usePlayerCrew(): Crew {
  return useGameStore((s) => s.game.crews.player);
}

export function usePlayerDrivers(): Driver[] {
  return useGameStore((s) => {
    const playerCrew = s.game.crews.player;
    return playerCrew.drivers.map((id) => s.game.drivers[id]).filter(Boolean);
  });
}

export function usePlayerCars(): Car[] {
  return useGameStore((s) => {
    const playerCrew = s.game.crews.player;
    return playerCrew.cars.map((id) => s.game.cars[id]).filter(Boolean);
  });
}

export function useEconomy() {
  return useGameStore((s) => s.game.economy);
}

export function useDistricts(): Record<string, District> {
  return useGameStore((s) => s.game.districts);
}

export function useCrew(crewId: CrewId): Crew | undefined {
  return useGameStore((s) => s.game.crews[crewId]);
}

export function useDriver(driverId: string): Driver | undefined {
  return useGameStore((s) => s.game.drivers[driverId]);
}

export function useCar(carId: string): Car | undefined {
  return useGameStore((s) => s.game.cars[carId]);
}
