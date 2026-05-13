import { create } from 'zustand';
import type { GameState, ScreenId, LeaderboardEntry, DebugEvent } from '../types/game';
import { getDefaultGameState } from './defaults';

interface GameStore {
  game: GameState;
  currentScreen: ScreenId;
  // Live data
  leaderboard: LeaderboardEntry[];
  sseConnected: boolean;
  liveEvents: Array<{ type: string; data: unknown; receivedAt: number }>;
  // Debug
  debugEvents: DebugEvent[];
  debugSeq: number;
  // Actions
  setScreen: (screen: ScreenId) => void;
  updateGame: (partial: Partial<GameState>) => void;
  resetGame: () => void;
  loadGame: (state: GameState) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setSseConnected: (connected: boolean) => void;
  addLiveEvent: (type: string, data: unknown) => void;
  logDebug: (message: string, data?: unknown) => void;
}

function makeDebugEvent(seq: number, message: string, data?: unknown): DebugEvent {
  return { id: seq, timestamp: Date.now(), message, data };
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: getDefaultGameState(),
  currentScreen: 'city-map',
  leaderboard: [],
  sseConnected: false,
  liveEvents: [],
  debugEvents: [],
  debugSeq: 0,
  setScreen: (screen) => set({ currentScreen: screen }),
  resetGame: () => set({ game: getDefaultGameState() }),
  loadGame: (state) => set({ game: state }),
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  setSseConnected: (connected) => set({ sseConnected: connected }),
  addLiveEvent: (type, data) => set((s) => ({
    liveEvents: [{ type, data, receivedAt: Date.now() }, ...s.liveEvents].slice(0, 20),
  })),
  logDebug: (message, data) => set((s) => {
    const seq = s.debugSeq + 1;
    const evt = makeDebugEvent(seq, message, data);
    console.log(`[Debug #${seq}]`, message, data ?? '');
    return {
      debugSeq: seq,
      debugEvents: [evt, ...s.debugEvents].slice(0, 50),
    };
  }),
  updateGame: (partial) => set((s) => {
    const before = {
      cash: s.game.economy.cash,
      rep: s.game.economy.rep,
      districtControl: Object.fromEntries(
        Object.entries(s.game.districts).map(([k, d]) => [k, d.controlPercent])
      ),
      completedRaces: s.game.completedRaceIds.length,
      activeRaces: s.game.activeRaces.length,
    };
    const next = { game: { ...s.game, ...partial } };
    const after = {
      cash: next.game.economy.cash,
      rep: next.game.economy.rep,
      districtControl: Object.fromEntries(
        Object.entries(next.game.districts).map(([k, d]) => [k, d.controlPercent])
      ),
      completedRaces: next.game.completedRaceIds.length,
      activeRaces: next.game.activeRaces.length,
    };
    console.log('[Store updateGame] before:', before, 'after:', after);
    // Also log via debug system
    const seq = s.debugSeq + 1;
    const debugEvt = makeDebugEvent(seq, 'Store.updateGame', { before, after });
    console.log(`[Debug #${seq}] Store.updateGame`, { before, after });
    return {
      ...next,
      debugSeq: seq,
      debugEvents: [debugEvt, ...s.debugEvents].slice(0, 50),
    };
  }),
}));
