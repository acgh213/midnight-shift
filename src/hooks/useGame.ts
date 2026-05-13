import { useMemo } from 'react';
import { useGameStore } from '../state/store';
import type { Crew, Driver, Car, District, CrewId } from '../types/game';

export function usePlayerCrew(): Crew {
  return useGameStore((s) => s.game.crews.player);
}

export function usePlayerDrivers(): Driver[] {
  const driverIds = useGameStore((s) => s.game.crews.player.drivers);
  const allDrivers = useGameStore((s) => s.game.drivers);

  return useMemo(
    () => driverIds.map((id) => allDrivers[id]).filter(Boolean),
    [driverIds, allDrivers]
  );
}

export function usePlayerCars(): Car[] {
  const carIds = useGameStore((s) => s.game.crews.player.cars);
  const allCars = useGameStore((s) => s.game.cars);

  return useMemo(
    () => carIds.map((id) => allCars[id]).filter(Boolean),
    [carIds, allCars]
  );
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
