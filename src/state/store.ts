import { create } from 'zustand';
import type { GameState, ScreenId, LeaderboardEntry } from '../types/game';
import { getDefaultGameState } from './defaults';

interface GameStore {
  game: GameState;
  currentScreen: ScreenId;
  // Live data
  leaderboard: LeaderboardEntry[];
  sseConnected: boolean;
  liveEvents: Array<{ type: string; data: unknown; receivedAt: number }>;
  // Actions
  setScreen: (screen: ScreenId) => void;
  updateGame: (partial: Partial<GameState>) => void;
  resetGame: () => void;
  loadGame: (state: GameState) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setSseConnected: (connected: boolean) => void;
  addLiveEvent: (type: string, data: unknown) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: getDefaultGameState(),
  currentScreen: 'city-map',
  leaderboard: [],
  sseConnected: false,
  liveEvents: [],
  setScreen: (screen) => set({ currentScreen: screen }),
  resetGame: () => set({ game: getDefaultGameState() }),
  loadGame: (state) => set({ game: state }),
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  setSseConnected: (connected) => set({ sseConnected: connected }),
  addLiveEvent: (type, data) => set((s) => ({
    liveEvents: [{ type, data, receivedAt: Date.now() }, ...s.liveEvents].slice(0, 20),
  })),
  updateGame: (partial) => set((s) => {
    const next = { game: { ...s.game, ...partial } };
    console.log('[Store updateGame] before cash:', s.game.economy.cash, 'after cash:', next.game.economy.cash);
    console.log('[Store updateGame] before completedRaces:', s.game.completedRaceIds.length, 'after:', next.game.completedRaceIds.length);
    return next;
  }),
}));
