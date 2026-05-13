import type { GameState } from '../types/game';

const SAVE_KEY = 'midnight-shift-save';
const CURRENT_VERSION = 2; // v0.2: added starter driver/car, recruitment, car market

export function saveGame(state: GameState): void {
  try {
    state.lastSaveTime = Date.now();
    state.version = CURRENT_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Version gate: discard saves from incompatible versions
    if (!parsed.version || parsed.version !== CURRENT_VERSION) {
      console.warn(`Discarding save with version ${parsed.version}, current is ${CURRENT_VERSION}`);
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    // Structural validation: must have essential keys
    if (!parsed.districts || !parsed.crews || !parsed.economy) {
      console.warn('Save missing essential keys, discarding');
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed as GameState;
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
