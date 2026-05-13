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
