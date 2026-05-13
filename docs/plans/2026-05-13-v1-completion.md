# v1 Completion — SSE, Leaderboard, Challenges, Production Build, PWA

> **For Hermes:** Implement task-by-task — dispatch subagents for independent workstreams where possible.

**Goal:** Wire the Go backend's live features into the frontend, add Leaderboard screen, production build, and PWA verification.

**Architecture:** SSE client hook → Zustand store → UI reacts. Leaderboard fetches REST + receives live updates via SSE. Challenges POST from MessageBoard. Go already knows how to serve `dist/` when it exists.

**Tech Stack:** React + Zustand + TypeScript frontend, Go chi + SQLite backend, Vite build tooling, vite-plugin-pwa.

---

## Workstream A: SSE Hook + Leaderboard Screen

### Task A1: Add leaderboard entry type and ScreenId

**Objective:** Add types for leaderboard entries and the new screen.

**Files:**
- Modify: `src/types/game.ts:215-233` (ScreenId union)
- Modify: `src/types/game.ts` (add LeaderboardEntry interface after line 326)

**Step 1:** Add `'leaderboard'` to ScreenId union

```typescript
export type ScreenId =
  | 'city-map'
  | 'garage'
  | 'car-detail'
  | 'car-market'
  | 'crew-roster'
  | 'driver-detail'
  | 'customization'
  | 'parts-shop'
  | 'race-setup'
  | 'race-live'
  | 'race-highlights'
  | 'message-board'
  | 'junkyard'
  | 'midnight-garage'
  | 'path-select'
  | 'prestige'
  | 'settings'
  | 'leaderboard'
  | 'more';
```

**Step 2:** Add LeaderboardEntry interface after SpecialEvent (before line 328)

```typescript
export interface LeaderboardEntry {
  rank: number;
  crewName: string;
  prestige: number;
  wins: number;
  losses: number;
  lastActive: string;
}
```

**Step 3:** Commit
```bash
git add src/types/game.ts
git commit -m "feat: add LeaderboardEntry type and leaderboard ScreenId"
```

---

### Task A2: Add leaderboard state to Zustand store

**Objective:** Extend the store with leaderboard entries and SSE connection status.

**Files:**
- Modify: `src/state/store.ts`

**Step 1:** Add state fields and actions to the store interface

```typescript
import type { GameState, ScreenId, LeaderboardEntry } from '../types/game';

interface GameStore {
  game: GameState;
  currentScreen: ScreenId;
  // NEW
  leaderboard: LeaderboardEntry[];
  sseConnected: boolean;
  liveEvents: Array<{ type: string; data: unknown; receivedAt: number }>;
  // Actions
  setScreen: (screen: ScreenId) => void;
  updateGame: (partial: Partial<GameState>) => void;
  resetGame: () => void;
  loadGame: (state: GameState) => void;
  // NEW
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setSseConnected: (connected: boolean) => void;
  addLiveEvent: (type: string, data: unknown) => void;
}
```

**Step 2:** Add defaults and action implementations

```typescript
export const useGameStore = create<GameStore>((set) => ({
  game: getDefaultGameState(),
  currentScreen: 'city-map',
  leaderboard: [],
  sseConnected: false,
  liveEvents: [],
  setScreen: (screen) => set({ currentScreen: screen }),
  updateGame: (partial) => set((s) => ({ game: { ...s.game, ...partial } })),
  resetGame: () => set({ game: getDefaultGameState() }),
  loadGame: (state) => set({ game: state }),
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  setSseConnected: (connected) => set({ sseConnected: connected }),
  addLiveEvent: (type, data) => set((s) => ({
    liveEvents: [{ type, data, receivedAt: Date.now() }, ...s.liveEvents].slice(0, 20),
  })),
}));
```

**Step 3:** Commit
```bash
git add src/state/store.ts
git commit -m "feat: add leaderboard + SSE state to Zustand store"
```

---

### Task A3: Create SSE client hook

**Objective:** Hook that connects to `/api/events` SSE stream, parses events, and dispatches to the store.

**Files:**
- Create: `src/hooks/useSSE.ts`

**Step 1:** Write the hook

```typescript
import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/store';
import type { LeaderboardEntry } from '../types/game';

export function useSSE() {
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const setSseConnected = useGameStore((s) => s.setSseConnected);
  const addLiveEvent = useGameStore((s) => s.addLiveEvent);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    es.onopen = () => {
      setSseConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'leaderboard_update':
            setLeaderboard(data as LeaderboardEntry[]);
            break;
          case 'crew_challenge':
          case 'night_change':
            addLiveEvent(type, data);
            break;
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setSseConnected(false);
      // EventSource auto-reconnects; no manual intervention needed
    };

    return () => {
      es.close();
      setSseConnected(false);
    };
  }, []);
}
```

**Step 2:** Commit
```bash
git add src/hooks/useSSE.ts
git commit -m "feat: add SSE client hook for live events"
```

---

### Task A4: Create Leaderboard screen

**Objective:** Display top 10 crews by prestige, fetches from `/api/leaderboard` on mount, updates live via store.

**Files:**
- Create: `src/components/screens/Leaderboard.tsx`

**Step 1:** Write the component

```typescript
import { useEffect } from 'react';
import { useGameStore } from '../../state/store';
import type { LeaderboardEntry } from '../../types/game';

export function Leaderboard() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const sseConnected = useGameStore((s) => s.sseConnected);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const game = useGameStore((s) => s.game);

  useEffect(() => {
    // Initial fetch while SSE connects
    fetch('/api/leaderboard?limit=10')
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) setLeaderboard(data.entries);
      })
      .catch(() => {});
  }, []);

  const playerCrewName = game.crews.player?.name || 'Midnight Crew';

  if (leaderboard.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Leaderboard</h1>
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">Loading standings…</p>
          <p className="text-gray-600 text-xs mt-2">
            {sseConnected ? 'Connected — live updates active.' : 'Connecting to server…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Leaderboard</h1>
        <span className={`text-[10px] px-2 py-0.5 rounded ${sseConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
          {sseConnected ? '● LIVE' : '○ offline'}
        </span>
      </div>

      <div className="bg-midnight border border-neon-cyan/20 rounded overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_80px_50px_50px] gap-2 px-3 py-2 bg-neon-cyan/5 border-b border-neon-cyan/10 text-[9px] uppercase tracking-wider text-gray-500">
          <span className="text-center">#</span>
          <span>Crew</span>
          <span className="text-right">Prestige</span>
          <span className="text-right">W</span>
          <span className="text-right">L</span>
        </div>

        {leaderboard.map((entry: LeaderboardEntry) => {
          const isPlayer = entry.crewName === playerCrewName;
          return (
            <div
              key={entry.rank}
              className={`grid grid-cols-[40px_1fr_80px_50px_50px] gap-2 px-3 py-2.5 border-b border-neon-cyan/5 text-xs transition-colors ${
                isPlayer ? 'bg-neon-pink/10 border-neon-pink/20' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-center font-bold ${entry.rank <= 3 ? 'text-neon-amber' : 'text-gray-500'}`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </span>
              <span className={isPlayer ? 'text-neon-pink font-bold' : 'text-gray-200'}>
                {entry.crewName}
              </span>
              <span className="text-right text-neon-purple tabular-nums">{entry.prestige}</span>
              <span className="text-right text-green-400 tabular-nums">{entry.wins}</span>
              <span className="text-right text-red-400 tabular-nums">{entry.losses}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-600 text-center">
        Rankings update live. Prestige resets to claim your spot.
      </p>
    </div>
  );
}
```

**Step 2:** Commit
```bash
git add src/components/screens/Leaderboard.tsx
git commit -m "feat: add Leaderboard screen with live SSE updates"
```

---

### Task A5: Wire Leaderboard into navigation and App router

**Objective:** Add Leaderboard to the "More" sheet and App screen router; activate SSE hook on mount.

**Files:**
- Modify: `src/components/layout/Navigation.tsx` (add to SECONDARY)
- Modify: `src/App.tsx` (add route case + SSE hook)

**Step 1:** Add to Navigation SECONDARY array (fills the 9th grid slot)

```typescript
const SECONDARY: NavItem[] = [
  { screen: 'car-market', icon: '🏪', label: 'Car Market' },
  { screen: 'customization', icon: '🎨', label: 'Customization' },
  { screen: 'parts-shop', icon: '🔧', label: 'Parts Shop' },
  { screen: 'junkyard', icon: '🪦', label: 'Junkyard' },
  { screen: 'race-live', icon: '📡', label: 'Race Live' },
  { screen: 'message-board', icon: '📋', label: 'Message Board' },
  { screen: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
  { screen: 'path-select', icon: '🛣', label: 'Your Path' },
  { screen: 'settings', icon: '⚙', label: 'Settings' },
];
```

**Step 2:** In App.tsx, import and use SSE hook, add Leaderboard route:

Add import:
```typescript
import { Leaderboard } from './components/screens/Leaderboard';
import { useSSE } from './hooks/useSSE';
```

Inside App component, call:
```typescript
useSSE();
```

Add case to renderScreen:
```typescript
case 'leaderboard':
  return <Leaderboard />;
```

**Step 3:** Commit
```bash
git add src/components/layout/Navigation.tsx src/App.tsx
git commit -m "feat: wire Leaderboard screen and SSE hook into app"
```

---

## Workstream B: Challenge Wiring in MessageBoard

### Task B1: Add challenge accept/decline to MessageBoard

**Objective:** When a rival crew challenges the player, show Accept/Decline buttons. On accept, POST to backend, simulate, and show result.

**Files:**
- Modify: `src/components/screens/MessageBoard.tsx`
- Create: `src/state/serverPersistence.ts` (add challenge function, or add inline)

**Step 1:** In MessageBoard, add click handlers for challenge-type posts. When a post has `eventType === 'challenge'`, render Accept/Decline buttons. On accept:

```typescript
const handleAcceptChallenge = async (event: GameEvent) => {
  const race = {
    districtId: event.districtId || 'downtown',
    stakes: 'medium' as const,
    posture: 'clean' as const,
    duration: '30m',
    playerCarIds: game.crews.player.cars.slice(0, 2),
    playerDriverIds: game.crews.player.drivers.slice(0, 2),
    endTime: Date.now() + 30 * 60 * 1000,
  };

  const district = game.districts[race.districtId];
  
  try {
    const res = await fetch('/api/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengerId: 'player',
        challengerName: game.crews.player.name,
        defenderId: event.crewId,
        race,
        drivers: game.drivers,
        cars: game.cars,
        district: {
          id: district.id,
          hazardChance: district.hazardList.length * 0.05,
        },
      }),
    });
    const result = await res.json();
    // Show result in a simple modal or alert
    alert(`${result.narrative}\n\n${result.outcome} — Rewards: ${result.rewards?.cash || 0} cash`);
  } catch {
    // silent fail
  }
};
```

**Step 2:** Add state for showing challenge result modal (local useState).

Render buttons on challenge posts:
```tsx
{post.eventType === 'challenge' && (
  <div className="flex gap-2 mt-2">
    <button
      onClick={() => handleAcceptChallenge(/* find matching GameEvent */)}
      className="text-[10px] px-2 py-1 bg-neon-pink/20 text-neon-pink rounded hover:bg-neon-pink/30"
    >
      Accept Challenge
    </button>
    <button className="text-[10px] px-2 py-1 bg-gray-800 text-gray-500 rounded hover:bg-gray-700">
      Decline
    </button>
  </div>
)}
```

**Step 3:** Commit
```bash
git add src/components/screens/MessageBoard.tsx
git commit -m "feat: add challenge accept/decline buttons to MessageBoard"
```

---

## Workstream C: Production Build + PWA

### Task C1: Build production dist

**Objective:** Run Vite build, verify dist/ is generated, ensure Go serves it.

**Files:**
- `dist/` (generated)

**Step 1:** Build
```bash
cd /home/exedev/midnight-shift && npx vite build
```

**Step 2:** Verify dist/ exists and contains index.html
```bash
ls -la dist/index.html dist/assets/
```

**Step 3:** The Go server's `findDistDir()` already checks `/home/exedev/midnight-shift/dist` — verify it finds it. Restart Go server and test:
```bash
# Kill old Go server, rebuild and restart
cd /home/exedev/midnight-shift/server
go build -o ~/ms-server ./cmd/midnight-shift/
pkill ms-server; ~/ms-server &
# Test: curl http://localhost:8080/ should return index.html
```

**Step 4:** Commit
```bash
# dist/ is in .gitignore, so just note the build
git add -A && git commit -m "build: production dist generated"
```

---

### Task C2: Verify PWA functionality

**Objective:** Check that vite-plugin-pwa generates service worker and manifest is correct.

**Files:**
- `dist/manifest.webmanifest` (generated)
- `dist/sw.js` (generated)

**Step 1:** After build, verify:
```bash
ls -la dist/manifest.webmanifest dist/sw.js
```

**Step 2:** Check manifest content has correct icons
```bash
cat dist/manifest.webmanifest | python3 -m json.tool
```

**Step 3:** If sw.js or manifest missing, check vite-plugin-pwa is installed and configured correctly. The config already has it — it should work.

**Step 4:** Commit (if any fixes needed)
```bash
git add -A && git commit -m "fix: PWA manifest and service worker generation"
```

---

## Verification Checklist

After all tasks complete:

1. **Leaderboard screen visible** — navigate to More → Leaderboard, see top 10
2. **SSE live indicator** — green "LIVE" dot when connected
3. **Challenge accept** — find a challenge post on Message Board, click Accept, see result
4. **Production build** — `curl http://localhost:8080/` returns the game HTML (not 404)
5. **PWA manifest** — `curl http://localhost:8080/manifest.webmanifest` returns valid JSON
6. **Service worker** — `curl http://localhost:8080/sw.js` returns JS
7. **Game works at https://hermes-sera.exe.xyz:4444** — full stack operational
