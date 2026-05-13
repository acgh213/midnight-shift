// Content registry — curated data bootstrapped into the game

export const contentRegistry = {
  crews: {},
  drivers: {},
  cars: {},
  districts: {},
  messageBoardHandles: [],
  dialogue: {},
};

/**
 * Load curated content into the game state.
 * Called once on game start (or New Game).
 */
export function loadCuratedContent(): typeof contentRegistry {
  // In v0: hardcoded imports from individual content files.
  // In v1: fetched from a content API or bundled JSON.
  return contentRegistry;
}
