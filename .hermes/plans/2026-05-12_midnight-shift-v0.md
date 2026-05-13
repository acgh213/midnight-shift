# Midnight Shift — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build v0 of Midnight Shift — a street racing idle RPG with neon aesthetics, crew management, race simulation, territory control, and prestige mechanics. Pure client-side SPA with localStorage persistence.

**Architecture:** Vite + React + TypeScript + Tailwind. Zustand for state management. Web Worker for race simulation. localStorage for persistence. PWA from day one. Deterministic sim engine with event-log output.

**Tech Stack:** React 19, TypeScript 5, Vite 8, Tailwind CSS 4, Zustand 5, vite-plugin-pwa (Workbox), Web Workers.

---

## Phase 1: Foundation

### Task 1.1: Set up Zustand store with game state type
**Objective:** Create the global game state store with initial default state.

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/types/game.ts` (already created)

**Step 1: Create the Zustand store**

```typescript
// src/state/store.ts
import { create } from 'zustand';
import type { GameState, ScreenId } from '../types/game';
import { getDefaultGameState } from './defaults';

interface GameStore {
  game: GameState;
  currentScreen: ScreenId;
  // Actions
  setScreen: (screen: ScreenId) => void;
  updateGame: (partial: Partial<GameState>) => void;
  resetGame: () => void;
  loadGame: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: getDefaultGameState(),
  currentScreen: 'city-map',
  setScreen: (screen) => set({ currentScreen: screen }),
  updateGame: (partial) => set((s) => ({ game: { ...s.game, ...partial } })),
  resetGame: () => set({ game: getDefaultGameState() }),
  loadGame: (state) => set({ game: state }),
}));
```

**Step 2: Create defaults factory**

```typescript
// src/state/defaults.ts
import type { GameState, CrewId } from '../types/game';

export function getDefaultGameState(): GameState {
  return {
    version: 1,
    night: 1,
    playerPath: 'racer',
    playerCrewId: 'player',
    economy: { cash: 500, rep: 0, info: 0, parts: [] },
    crews: {
      player: {
        id: 'player',
        name: 'Midnight Shift',
        leaderId: '',
        drivers: [],
        cars: [],
        homeDistrict: 'industrial',
        rep: 0,
        cash: 500,
      },
      'iron-dogs': {
        id: 'iron-dogs', name: 'Iron Dogs', leaderId: 'diesel-marquez',
        drivers: [], cars: [], homeDistrict: 'industrial', rep: 40, cash: 2000,
      },
      'glass-tigers': {
        id: 'glass-tigers', name: 'Glass Tigers', leaderId: 'mireille-vance',
        drivers: [], cars: [], homeDistrict: 'downtown', rep: 60, cash: 3000,
      },
      'salt-devils': {
        id: 'salt-devils', name: 'Salt Devils', leaderId: 'kaito-mori',
        drivers: [], cars: [], homeDistrict: 'coastal', rep: 50, cash: 2500,
      },
      'ridge-runners': {
        id: 'ridge-runners', name: 'Ridge Runners', leaderId: 'anya-vey',
        drivers: [], cars: [], homeDistrict: 'mountain', rep: 45, cash: 2200,
      },
      'hollow-men': {
        id: 'hollow-men', name: 'Hollow Men', leaderId: 'the-curator',
        drivers: [], cars: [], homeDistrict: 'underground', rep: 55, cash: 2800,
      },
      'velvet-cartel': {
        id: 'velvet-cartel', name: 'Velvet Cartel', leaderId: 'octavia-reine',
        drivers: [], cars: [], homeDistrict: 'strip', rep: 70, cash: 5000,
      },
    },
    drivers: {},
    cars: {},
    districts: {
      industrial: {
        id: 'industrial', name: 'Industrial District',
        vibe: 'Warehouses, shipping containers, empty lots',
        roadType: 'Tight corners, debris hazards',
        hazardList: ['debris', 'blind corners', 'loose gravel'],
        perk: { name: 'Scrap Discount', description: 'Parts cost −10%', effect: { type: 'parts_cost', value: -10 } },
        controlPercent: 0, rivalCrewId: 'iron-dogs',
      },
      downtown: {
        id: 'downtown', name: 'Downtown',
        vibe: 'Skyscrapers, parking garages, neon canyons',
        roadType: 'Grid streets, traffic weaving',
        hazardList: ['traffic', 'gridlock', 'pedestrians'],
        perk: { name: 'Extra Bay', description: '+1 garage slot', effect: { type: 'garage_slot', value: 1 } },
        controlPercent: 0, rivalCrewId: 'glass-tigers',
      },
      coastal: {
        id: 'coastal', name: 'Coastal Highway',
        vibe: 'Ocean on one side, cliffs on the other',
        roadType: 'Long straights, sweeping curves',
        hazardList: ['crosswinds', 'wet pavement', 'cliff edge'],
        perk: { name: 'Salt Breeze', description: 'Top-speed cap +5%', effect: { type: 'top_speed', value: 5 } },
        controlPercent: 0, rivalCrewId: 'salt-devils',
      },
      mountain: {
        id: 'mountain', name: 'Mountain Pass',
        vibe: 'Winding roads, fog, guardrails',
        roadType: 'Hairpins, elevation changes',
        hazardList: ['fog', 'guardrails', 'falling rocks', 'ice patches'],
        perk: { name: 'Tough Tires', description: 'Wear rate −15%', effect: { type: 'wear_rate', value: -15 } },
        controlPercent: 0, rivalCrewId: 'ridge-runners',
      },
      underground: {
        id: 'underground', name: 'Underground',
        vibe: 'Tunnels, subway access, drainage',
        roadType: 'No visibility, echo, tight',
        hazardList: ['darkness', 'water', 'debris', 'narrow passages'],
        perk: { name: 'Word of Mouth', description: 'Recruit cost −20%', effect: { type: 'recruit_cost', value: -20 } },
        controlPercent: 0, rivalCrewId: 'hollow-men',
      },
      strip: {
        id: 'strip', name: 'The Strip',
        vibe: 'Clubs, casinos, tourist traps',
        roadType: 'Wide boulevards, traffic, cops',
        hazardList: ['traffic', 'police', 'tourists', 'valet lanes'],
        perk: { name: 'Star Power', description: 'Rep multiplier +10%', effect: { type: 'rep_multiplier', value: 10 } },
        controlPercent: 0, rivalCrewId: 'velvet-cartel',
      },
    },
    activeRaces: [],
    completedRaceIds: [],
    raceResults: {},
    prestigeCarryover: {
      garageSlots: 2,
      startingCashFloor: 200,
      repMultiplier: 1.0,
      signatureDriverKept: null,
      permanentUnlocks: [],
    },
    unlockedTunes: [],
    settings: {
      crtScanlines: false,
      soundEnabled: true,
      musicVolume: 50,
      sfxVolume: 80,
    },
    hardcoreMode: false,
    nightStartTime: Date.now(),
    lastSaveTime: Date.now(),
  };
}
```

**Verification:** Import `useGameStore` in App.tsx, verify the store initializes without errors. Run `npm run build`.

**Commit:** `feat: add Zustand store with default game state`

---

### Task 1.2: Create save/load system
**Objective:** Persist game state to localStorage with JSON export/import.

**Files:**
- Create: `src/state/persistence.ts`

**Step 1: Write persistence module**

```typescript
// src/state/persistence.ts
import type { GameState } from '../types/game';

const SAVE_KEY = 'midnight-shift-save';

export function saveGame(state: GameState): void {
  try {
    state.lastSaveTime = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

export function exportSave(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importSave(json: string): GameState | null {
  try {
    return JSON.parse(json) as GameState;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
```

**Step 2: Wire auto-save into store**

Add to `src/state/store.ts`:
```typescript
import { saveGame } from './persistence';

// In the store definition, add a middleware wrapper:
// For now, call saveGame(game) manually after major state changes.
// Later, use Zustand middleware for auto-persistence.
```

**Verification:** In browser console, call `saveGame(state)`, reload, call `loadGame()` — verify state round-trips cleanly.

**Commit:** `feat: add save/load persistence layer`

---

### Task 1.3: Wire up App with real store
**Objective:** Replace App.tsx local state with Zustand store for screen navigation.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Refactor App.tsx**

```typescript
import { useGameStore } from './state/store';
import { CityMap } from './components/screens/CityMap';
import { Garage } from './components/screens/Garage';
import { CrewRoster } from './components/screens/CrewRoster';
import { MessageBoard } from './components/screens/MessageBoard';
import { Settings } from './components/screens/Settings';
import { Navigation } from './components/layout/Navigation';
import { useEffect } from 'react';
import { loadGame } from './state/persistence';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const loadGameState = useGameStore((s) => s.loadGame);

  useEffect(() => {
    const saved = loadGame();
    if (saved) loadGameState(saved);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'city-map': return <CityMap />;
      case 'garage': return <Garage />;
      case 'crew-roster': return <CrewRoster />;
      case 'message-board': return <MessageBoard />;
      case 'settings': return <Settings />;
      default: return <CityMap />;
    }
  };

  return (
    <div className="min-h-dvh bg-asphalt text-gray-200 font-mono">
      <Navigation currentScreen={currentScreen} onNavigate={setScreen} />
      <main className="pb-20 px-2 pt-2 max-w-2xl mx-auto">
        {renderScreen()}
      </main>
    </div>
  );
}
```

**Verification:** `npm run build` passes. App opens to City Map. Navigation works.

**Commit:** `refactor: wire App to Zustand store with save/load`

---

## Phase 2: Crew & Garage

### Task 2.1: Create useGame hook with derived selectors
**Objective:** Create a custom hook that provides convenient derived data (player crew, owned cars, etc).

**Files:**
- Create: `src/hooks/useGame.ts`

**Step 1: Write hook**

```typescript
// src/hooks/useGame.ts
import { useGameStore } from '../state/store';
import type { Crew, Driver, Car, District, CarArchetype } from '../types/game';

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

export function useCrew(crewId: string): Crew | undefined {
  return useGameStore((s) => s.game.crews[crewId]);
}

export function useDriver(driverId: string): Driver | undefined {
  return useGameStore((s) => s.game.drivers[driverId]);
}

export function useCar(carId: string): Car | undefined {
  return useGameStore((s) => s.game.cars[carId]);
}
```

**Verification:** Import and use in a component, verify derived data matches store.

**Commit:** `feat: add useGame hook with derived selectors`

---

### Task 2.2: Build Garage screen with car list
**Objective:** Display the player's cars in the Garage screen with condition bars and quick-action buttons.

**Files:**
- Modify: `src/components/screens/Garage.tsx`
- Create: `src/components/shared/CarCard.tsx`

**Step 1: Create CarCard component**

```tsx
// src/components/shared/CarCard.tsx
import type { Car } from '../../types/game';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
}

export function CarCard({ car, onClick }: CarCardProps) {
  const conditionColor = car.condition > 70 ? 'bg-green-500' : car.condition > 30 ? 'bg-neon-amber' : 'bg-red-500';

  return (
    <div
      onClick={onClick}
      className="bg-midnight border border-neon-cyan/20 rounded p-3 cursor-pointer hover:border-neon-pink/50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-bold text-neon-cyan">{car.name}</div>
          <div className="text-xs text-gray-500">{car.archetype} · Class {car.class}</div>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded border border-neon-cyan/30 text-neon-cyan">
          {car.class}
        </span>
      </div>
      {/* Condition bar */}
      <div className="mt-2 h-1.5 bg-pavement rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${conditionColor}`}
          style={{ width: `${car.condition}%` }}
        />
      </div>
      {car.assignedDriverId && (
        <div className="mt-1 text-xs text-gray-500">Driver assigned</div>
      )}
    </div>
  );
}
```

**Step 2: Update Garage screen**

```tsx
// src/components/screens/Garage.tsx
import { usePlayerCars } from '../../hooks/useGame';
import { CarCard } from '../shared/CarCard';

export function Garage() {
  const cars = usePlayerCars();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Garage</h1>
      {cars.length === 0 ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No cars in your garage yet.</p>
          <p className="text-gray-600 text-xs mt-2">Win races to earn cash and build your fleet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Verification:** Build passes. Garage shows empty state when no cars.

**Commit:** `feat: add Garage screen with CarCard component`

---

### Task 2.3: Build Crew Roster screen with driver list
**Objective:** Display player drivers with stats, loyalty bars, and risk indicators.

**Files:**
- Modify: `src/components/screens/CrewRoster.tsx`
- Create: `src/components/shared/DriverCard.tsx`

**Step 1: Create DriverCard component**

```tsx
// src/components/shared/DriverCard.tsx
import type { Driver } from '../../types/game';

interface DriverCardProps {
  driver: Driver;
  onClick?: () => void;
}

const STAT_LABELS: Record<string, string> = {
  speed: 'SPD',
  control: 'CTL',
  aggression: 'AGG',
  reputation: 'REP',
};

export function DriverCard({ driver, onClick }: DriverCardProps) {
  const loyaltyColor = driver.loyalty > 50 ? 'bg-green-500' : driver.loyalty > 25 ? 'bg-neon-amber' : 'bg-red-500';
  const poachRisk = driver.loyalty < 25;

  return (
    <div
      onClick={onClick}
      className="bg-midnight border border-neon-cyan/20 rounded p-3 cursor-pointer hover:border-neon-pink/50 transition-colors relative"
    >
      {poachRisk && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded">
          POACH RISK
        </div>
      )}
      <div className="flex justify-between">
        <div>
          <div className="text-sm font-bold text-neon-pink">{driver.name}</div>
          {driver.nickname && <div className="text-xs text-gray-400">"{driver.nickname}"</div>}
          <div className="text-xs text-gray-500 mt-1">{driver.personality}</div>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {Object.entries(STAT_LABELS).map(([key, label]) => (
              <div key={key}>
                <span className="text-gray-600">{label}</span>{' '}
                <span className="text-gray-300">{driver.stats[key as keyof typeof driver.stats]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Loyalty bar */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-gray-600 w-12">LOYALTY</span>
        <div className="flex-1 h-1.5 bg-pavement rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${loyaltyColor}`}
            style={{ width: `${driver.loyalty}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-600 w-6">{driver.loyalty}</span>
      </div>
    </div>
  );
}
```

**Step 2: Update CrewRoster screen**

```tsx
// src/components/screens/CrewRoster.tsx
import { usePlayerDrivers } from '../../hooks/useGame';
import { DriverCard } from '../shared/DriverCard';

export function CrewRoster() {
  const drivers = usePlayerDrivers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Crew</h1>
      {drivers.length === 0 ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No drivers recruited yet.</p>
          <p className="text-gray-600 text-xs mt-2">Find talent at the Junkyard or poach from rivals.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {drivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Verification:** Build passes. Crew Roster shows empty state.

**Commit:** `feat: add Crew Roster with DriverCard component`

---

## Phase 3: Race Engine

### Task 3.1: Implement deterministic PRNG
**Objective:** Create a seedable PRNG for deterministic simulation.

**Files:**
- Create: `src/engine/prng.ts`

```typescript
// Mulberry32 — simple, fast, seedable 32-bit PRNG
export function createPRNG(seed: number) {
  let state = seed | 0;
  return function next(): number {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle array deterministically using Fisher-Yates
export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Roll a D100 (0–99) from the PRNG
export function d100(rand: () => number): number {
  return Math.floor(rand() * 100);
}

// Weighted random pick
export function weightedPick<T>(items: T[], weights: number[], rand: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
```

**Verification:** Write a quick test in console: `createPRNG(42)()` returns consistent values. Or just verify build passes.

**Commit:** `feat: add deterministic PRNG (Mulberry32)`

---

### Task 3.2: Implement race simulation core
**Objective:** Build the tick-based race simulator that produces event logs.

**Files:**
- Modify: `src/engine/simulator.ts` (replace placeholder)

**Step 1: Implement the simulation loop**

```typescript
// src/engine/simulator.ts
import type { RaceSetup, RaceResult, RaceEvent, District } from '../types/game';
import { createPRNG, d100 } from './prng';

const TICK_COUNT: Record<string, number> = { '5m': 20, '30m': 60, '4h': 120, '8h': 200 };

export function simulateRace(
  race: RaceSetup,
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  district: District,
): RaceResult {
  const rand = createPRNG(race.seed);
  const ticks = TICK_COUNT[race.length] || 60;
  const events: RaceEvent[] = [];

  // Placeholder: simulate positions for player drivers
  // In full implementation, this uses driver/car stats + road conditions
  for (let tick = 0; tick < ticks; tick++) {
    // 5% chance of a notable event per tick
    if (d100(rand) < 5) {
      events.push({
        tick,
        type: 'OVERTAKE',
        drivers: [race.playerDriverIds[0]],
        severity: d100(rand),
        location: district.name,
      });
    }
  }

  // Always add a finish event
  events.push({
    tick: ticks,
    type: 'FINISH',
    drivers: race.playerDriverIds,
    severity: 0,
    location: district.name,
  });

  // Determine outcome based on stake level
  const outcomeRoll = d100(rand);
  const winThreshold = race.stakes === 'low' ? 80 : race.stakes === 'mid' ? 60 : race.stakes === 'high' ? 40 : 30;
  const outcome = outcomeRoll >= winThreshold ? 'win' : (outcomeRoll >= winThreshold - 10 ? 'draw' : 'loss');

  const rewardMultiplier = race.stakes === 'low' ? 1 : race.stakes === 'mid' ? 2 : race.stakes === 'high' ? 4 : 8;

  return {
    raceId: race.id,
    outcome: outcome as 'win' | 'loss' | 'draw',
    position: outcome === 'win' ? 1 : outcome === 'draw' ? 2 : 3,
    finishTime: Date.now(),
    events,
    rewards: {
      cash: outcome === 'win' ? 100 * rewardMultiplier : outcome === 'draw' ? 30 * rewardMultiplier : 0,
      rep: outcome === 'win' ? 5 * rewardMultiplier : 1,
      parts: [],
      info: Math.floor(Math.random() * 3) + 1,
    },
    driverStatChanges: outcome === 'win'
      ? { [race.playerDriverIds[0]]: { speed: 1, reputation: 2 } }
      : {},
    districtControlChange: outcome === 'win' ? 3 : outcome === 'loss' ? -1 : 0,
  };
}

export function simulateOfflineRaces(
  completedRaces: RaceSetup[],
  _drivers: Record<string, unknown>,
  _cars: Record<string, unknown>,
  districts: Record<string, District>,
): RaceResult[] {
  return completedRaces.map((race) =>
    simulateRace(race, _drivers, _cars, districts[race.districtId])
  );
}
```

**Verification:** `npm run build` passes. Simulator produces valid RaceResult objects.

**Commit:** `feat: implement race simulation core with event log`

---

### Task 3.3: Create Race Setup screen
**Objective:** Build the interface for selecting drivers, cars, district, stakes, and posture.

**Files:**
- Create: `src/components/screens/RaceSetup.tsx`

```tsx
import { useState } from 'react';
import { useGameStore } from '../../state/store';
import type { RaceSetup, DistrictId, Stakes, Posture, RaceLength } from '../../types/game';
import { usePlayerDrivers, usePlayerCars, useDistricts } from '../../hooks/useGame';

export function RaceSetup() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const drivers = usePlayerDrivers();
  const cars = usePlayerCars();
  const districts = useDistricts();

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('industrial');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedCar, setSelectedCar] = useState('');
  const [stakes, setStakes] = useState<Stakes>('low');
  const [posture, setPosture] = useState<Posture>('safe');

  const handleStart = () => {
    if (!selectedDriver || !selectedCar) return;

    const lengthMap: Record<Stakes, RaceLength> = {
      low: '5m', mid: '30m', high: '4h', boss: '8h',
    };

    const race: RaceSetup = {
      id: `race-${Date.now()}`,
      districtId: selectedDistrict,
      stakes,
      posture,
      length: lengthMap[stakes],
      playerCarIds: [selectedCar],
      playerDriverIds: [selectedDriver],
      rivalCarIds: [], // Will be populated by rival AI
      rivalDriverIds: [],
      startTime: Date.now(),
      endTime: Date.now() + (stakes === 'low' ? 5 * 60000 : stakes === 'mid' ? 30 * 60000 : stakes === 'high' ? 4 * 3600000 : 8 * 3600000),
      seed: Math.floor(Math.random() * 1000000),
    };

    updateGame({ activeRaces: [...game.activeRaces, race] });
  };

  if (drivers.length === 0 || cars.length === 0) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">You need a driver and a car to race.</p>
        <p className="text-gray-600 text-xs mt-2">Recruit drivers and build your garage first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Set Up Race</h1>

      {/* District selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">District</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {Object.entries(districts).map(([id, d]) => (
            <button
              key={id}
              onClick={() => setSelectedDistrict(id as DistrictId)}
              className={`text-left p-2 rounded border text-sm transition-colors ${
                selectedDistrict === id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight hover:border-neon-cyan/50'
              }`}
            >
              <div className="text-neon-cyan">{d.name}</div>
              <div className="text-[10px] text-gray-500">{d.roadType}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Driver selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Driver</label>
        <div className="grid gap-2 mt-1">
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDriver(d.id)}
              className={`text-left p-2 rounded border text-sm ${
                selectedDriver === d.id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight'
              }`}
            >
              {d.name} ({d.personality})
            </button>
          ))}
        </div>
      </div>

      {/* Car selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Car</label>
        <div className="grid gap-2 mt-1">
          {cars.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCar(c.id)}
              className={`text-left p-2 rounded border text-sm ${
                selectedCar === c.id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight'
              }`}
            >
              {c.name} — Class {c.class}
            </button>
          ))}
        </div>
      </div>

      {/* Stakes */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Stakes</label>
        <div className="flex gap-2 mt-1">
          {(['low', 'mid', 'high', 'boss'] as Stakes[]).map((s) => (
            <button
              key={s}
              onClick={() => setStakes(s)}
              className={`flex-1 py-1.5 rounded border text-xs uppercase ${
                stakes === s
                  ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                  : 'border-neon-cyan/20 text-gray-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posture */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Posture</label>
        <div className="flex gap-2 mt-1">
          {(['safe', 'push', 'reckless'] as Posture[]).map((p) => (
            <button
              key={p}
              onClick={() => setPosture(p)}
              className={`flex-1 py-1.5 rounded border text-xs uppercase ${
                posture === p
                  ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                  : 'border-neon-cyan/20 text-gray-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!selectedDriver || !selectedCar}
        className="w-full py-3 bg-neon-pink text-black font-bold rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-pink/80 transition-colors"
      >
        Start Race
      </button>
    </div>
  );
}
```

**Verification:** Build passes. Race Setup screen renders with district/driver/car/stakes/posture selectors.

**Commit:** `feat: add Race Setup screen`

---

### Task 3.4: Create Race Live screen with tick viewer
**Objective:** Display active races with live tick updates (for short races).

**Files:**
- Create: `src/components/screens/RaceLive.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '../../state/store';
import type { RaceSetup, RaceResult, RaceEvent } from '../../types/game';
import { simulateRace } from '../../engine/simulator';

export function RaceLive() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const activeRaces = game.activeRaces;
  const [liveEvents, setLiveEvents] = useState<RaceEvent[]>([]);
  const [completedRaces, setCompletedRaces] = useState<RaceResult[]>([]);

  useEffect(() => {
    if (activeRaces.length === 0) return;

    const race = activeRaces[0];
    const district = game.districts[race.districtId];

    // For short races, simulate and show events gradually
    if (race.length === '5m' || race.length === '30m') {
      const result = simulateRace(race, game.drivers, game.cars, district);
      setLiveEvents(result.events);

      // After all events shown, mark as completed
      const totalTime = race.length === '5m' ? 3000 : 5000; // speed up for demo
      const timer = setTimeout(() => {
        setCompletedRaces((prev) => [...prev, result]);
        const newRaces = activeRaces.filter((r) => r.id !== race.id);
        updateGame({
          activeRaces: newRaces,
          raceResults: { ...game.raceResults, [result.raceId]: result },
          completedRaceIds: [...game.completedRaceIds, result.raceId],
        });
      }, totalTime);

      return () => clearTimeout(timer);
    }
  }, []);

  if (activeRaces.length === 0 && completedRaces.length === 0) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">No active races.</p>
        <p className="text-gray-600 text-xs mt-2">Set up a race to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Race Live</h1>

      {/* Active race info */}
      {activeRaces.length > 0 && (
        <div className="bg-midnight border border-neon-pink/30 rounded p-4">
          <div className="text-sm text-neon-pink">Race in progress...</div>
          <div className="text-xs text-gray-500 mt-1">
            District: {game.districts[activeRaces[0].districtId]?.name} · Stakes: {activeRaces[0].stakes}
          </div>
          {/* Event log */}
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {liveEvents.map((event, i) => (
              <div key={i} className="text-gray-400">
                <span className="text-gray-600">[{event.tick}]</span>{' '}
                {event.type === 'OVERTAKE' && '🚗 Overtake!'}
                {event.type === 'FINISH' && '🏁 Race finished!'}
                {' — '}{event.location}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed races */}
      {completedRaces.map((result) => (
        <div key={result.raceId} className="bg-midnight border border-neon-cyan/20 rounded p-4">
          <div className={`text-sm font-bold ${result.outcome === 'win' ? 'text-green-400' : result.outcome === 'draw' ? 'text-neon-amber' : 'text-red-400'}`}>
            {result.outcome.toUpperCase()}!
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +${result.rewards.cash} · +{result.rewards.rep} Rep · +{result.districtControlChange}% Control
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Verification:** Build passes. Race Live screen shows event log for active races.

**Commit:** `feat: add Race Live screen with event viewer`

---

### Task 3.5: Add Race screens to App and navigation
**Objective:** Wire RaceSetup and RaceLive into the app.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Navigation.tsx`

Add race-setup and race-live to the screen switch and navigation.

**Verification:** Can navigate to Race Setup, configure and start a race, see it in Race Live.

**Commit:** `feat: integrate Race setup and Live into app navigation`

---

## Phase 4: City Map

### Task 4.1: Build City Map screen with district visualization
**Objective:** Display all 6 districts as interactive cards with control bars and rival info.

**Files:**
- Modify: `src/components/screens/CityMap.tsx`

Replace placeholder with full implementation showing districts, control bars, active race timers, and quick race-launch buttons.

**Verification:** City Map shows all 6 districts with 0% control. Each district shows its rival crew. Tapping a district navigates to Race Setup with that district pre-selected.

**Commit:** `feat: implement City Map with districts and control visualization`

---

### Task 4.2: Add district control updates from race results
**Objective:** When a race finishes, update the district control percentage.

**Files:**
- Modify: `src/engine/simulator.ts` (control change already in RaceResult)
- Create: `src/engine/economy.ts` — helper that applies RaceResult to game state

```typescript
// src/engine/economy.ts
import type { GameState, RaceResult } from '../types/game';

export function applyRaceResult(state: GameState, result: RaceResult): GameState {
  const next = { ...state };

  // Update economy
  next.economy = {
    ...next.economy,
    cash: next.economy.cash + result.rewards.cash,
    rep: next.economy.rep + result.rewards.rep,
    info: next.economy.info + result.rewards.info,
    parts: [...next.economy.parts, ...result.rewards.parts],
  };

  // Update player crew
  next.crews = { ...next.crews };
  next.crews.player = {
    ...next.crews.player,
    cash: next.crews.player.cash + result.rewards.cash,
  };

  // Update district control (need the districtId — store it on RaceResult in full impl)
  // For now: stub

  return next;
}
```

**Verification:** After a race, player cash and rep increase.

**Commit:** `feat: apply race results to game state`

---

## Phase 5: Economy & Prestige

### Task 5.1: Implement idle income system
**Objective:** When the player returns after being away, calculate offline earnings.

**Files:**
- Create: `src/engine/idle.ts`

Calculate cash/rep per hour based on controlled districts (with 8-hour cap). Show "Last Night's Recap" on return.

**Verification:** After setting a timer and returning, idle income is calculated correctly.

**Commit:** `feat: add idle income with offline catch-up`

---

### Task 5.2: Implement Prestige screen
**Objective:** "New Night" screen: show carryover options, let player pick a signature driver to keep, reset progress.

**Files:**
- Create: `src/components/screens/Prestige.tsx`

**Verification:** Prestige resets districts but keeps garage slots, starting cash floor, and chosen driver.

**Commit:** `feat: add Prestige (New Night) system`

---

## Phase 6: Content

### Task 6.1: Create curated crew leaders data
**Objective:** Write the 6 crew leaders with bios, stat blocks, and dialogue.

**Files:**
- Create: `src/content/crews/iron-dogs.ts`
- Create: `src/content/crews/glass-tigers.ts`
- Create: `src/content/crews/salt-devils.ts`
- Create: `src/content/crews/ridge-runners.ts`
- Create: `src/content/crews/hollow-men.ts`
- Create: `src/content/crews/velvet-cartel.ts`
- Create: `src/content/crews/index.ts` (barrel export)

Each file exports a crew leader Driver, a Crew config, and their signature car.

**Verification:** All crew leaders load into state on new game creation.

**Commit:** `feat: add curated crew leader content`

---

### Task 6.2: Create curated cars database
**Objective:** ~15 hero cars across archetypes and classes.

**Files:**
- Create: `src/content/cars/hero-cars.ts`

**Verification:** Cars load on new game.

**Commit:** `feat: add curated hero cars`

---

### Task 6.3: Create procedural driver generator
**Objective:** Generate rank-and-file drivers with names, stats, personalities, and 2-sentence backstories.

**Files:**
- Modify: `src/generators/drivers.ts` (replace placeholder with full generator)

**Verification:** `generateDriver(seed, crewId, archetype)` produces unique drivers with valid stats.

**Commit:** `feat: implement procedural driver generator`

---

## Phase 7: Message Board

### Task 7.1: Build Message Board generator
**Objective:** Generate posts based on recent race results, poaching events, territory changes.

**Files:**
- Create: `src/generators/message-board.ts`
- Modify: `src/components/screens/MessageBoard.tsx`

**Verification:** After a race, the Message Board shows relevant posts.

**Commit:** `feat: add procedural Message Board generator`

---

## Phase 8: Path System

### Task 8.1: Implement Racer vs Boss path selection
**Objective:** Let player choose Racer (own driver slot, solo events, personal XP) or Boss (Boss Vision overlay, crew orders, recruitment discount).

**Files:**
- Create: `src/engine/paths.ts` — path-specific mechanics
- Create: `src/components/screens/PathSelect.tsx`

**Verification:** Switching paths changes available actions. Boss sees rival movement. Racer has personal stat sheet.

**Commit:** `feat: add Racer vs Boss path system`

---

## Phase 9: Polish

### Task 9.1: CRT scanlines toggle
**Objective:** Wire the CRT scanlines CSS class toggle to the settings state.

**Files:**
- Modify: `src/App.tsx` — apply `.crt-scanlines` class conditionally
- Modify: `src/components/screens/Settings.tsx` — working toggle

**Verification:** Toggling CRT scanlines in Settings adds/removes the overlay.

**Commit:** `feat: add working CRT scanlines toggle`

---

### Task 9.2: Add sound stubs
**Objective:** Placeholder audio hooks for ambient synth and race SFX.

**Files:**
- Create: `src/hooks/useAudio.ts`

```typescript
// src/hooks/useAudio.ts
export function useAudio() {
  return {
    playEngine: () => {}, // stub
    playCrash: () => {}, // stub
    playFinish: () => {}, // stub
    toggleMusic: () => {}, // stub
  };
}
```

**Verification:** Build passes. Sound hooks don't error.

**Commit:** `feat: add audio hook stubs`

---

### Task 9.3: PWA verification and icon generation
**Objective:** Verify PWA works offline, generate app icons.

- Run `npm run build` and serve with `npx serve dist`
- Test offline: load page, go offline, reload — should still render
- Generate 192x192 and 512x512 app icons (placeholder: solid neon-pink square for now)

**Verification:** PWA installs, works offline, shows correct manifest.

**Commit:** `feat: verify PWA and add app icons`

---

## Implementation Order

Execute phases in order:
1. Foundation (1.1 → 1.2 → 1.3)
2. Crew & Garage (2.1 → 2.2 → 2.3)
3. Race Engine (3.1 → 3.2 → 3.3 → 3.4 → 3.5)
4. City Map (4.1 → 4.2)
5. Economy & Prestige (5.1 → 5.2)
6. Content (6.1 → 6.2 → 6.3)
7. Message Board (7.1)
8. Path System (8.1)
9. Polish (9.1 → 9.2 → 9.3)

**Each phase depends on the previous one.**

---

## Testing Strategy

- **Unit tests** for engine functions (simulator, PRNG, generators): `src/engine/__tests__/`
- **Component tests** for screens: each screen renders without crashing, shows correct states
- **Integration tests** for game flow: create crew → set up race → run race → see results → prestige
- **Run:** `npm test` using Vitest (add to devDependencies in task 1.1)

---

## Risks & Open Questions

- **Race simulation balance** — placeholder simulator uses loose RNG. Real balancing comes after content is in.
- **Mobile readability** — text-log race view on phone needs prototyping to verify drama comes through.
- **Save migration** — if GameState type changes, old saves break. Add version field and migration function.
- **Content scope** — writing 6 crew leaders with dialogue is creative work, not engineering. May need Cassie's input on voice.
