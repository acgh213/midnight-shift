import { useGameStore } from '../../state/store';
import { saveGame } from '../../state/persistence';
import { getDefaultGameState } from '../../state/defaults';

const PATH_LABELS: Record<string, string> = {
  racer: 'The Racer',
  boss: 'The Boss',
};

export function Settings() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const setScreen = useGameStore((s) => s.setScreen);

  const toggleScanlines = () => {
    const next = { ...game.settings, crtScanlines: !game.settings.crtScanlines };
    updateGame({ settings: next });
  };

  const toggleSound = () => {
    const next = { ...game.settings, soundEnabled: !game.settings.soundEnabled };
    updateGame({ settings: next });
  };

  const handleReset = () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      const fresh = getDefaultGameState();
      fresh.settings = game.settings;
      loadGame(fresh);
      saveGame(fresh);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Settings</h1>

      <div className="bg-midnight border border-neon-cyan/20 rounded p-4 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">CRT Scanlines</span>
          <input
            type="checkbox"
            checked={game.settings.crtScanlines}
            onChange={toggleScanlines}
            className="accent-neon-pink"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Sound</span>
          <input
            type="checkbox"
            checked={game.settings.soundEnabled}
            onChange={toggleSound}
            className="accent-neon-pink"
          />
        </label>

        <div className="pt-3 border-t border-neon-cyan/10">
          <button
            onClick={() => setScreen('path-select')}
            className="w-full py-2 border border-neon-cyan/30 text-neon-cyan text-sm rounded hover:bg-neon-cyan/10 transition-colors flex justify-between items-center px-3"
          >
            <span>Your Path</span>
            <span className="text-xs text-gray-500">{PATH_LABELS[game.playerPath]}</span>
          </button>
        </div>

        <div className="pt-4 border-t border-neon-cyan/10 space-y-2">
          <p className="text-xs text-gray-600 text-center">
            Night {game.night} · {Object.values(game.districts).filter((d) => d.controlPercent >= 50).length}/6 districts controlled
          </p>

          {Object.values(game.districts).filter((d) => d.controlPercent >= 50).length >= 1 && (
            <button
              onClick={() => useGameStore.getState().setScreen('prestige')}
              className="w-full py-2 border border-neon-pink/30 text-neon-pink text-sm rounded hover:bg-neon-pink/10 transition-colors"
            >
              New Night (Prestige)
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2 border border-red-500/30 text-red-400 text-xs rounded hover:bg-red-500/10 transition-colors"
          >
            Reset All Progress
          </button>
        </div>

        <div className="pt-2 border-t border-neon-cyan/10">
          <p className="text-xs text-gray-600 text-center">Midnight Shift v0.2.0</p>
        </div>
      </div>
    </div>
  );
}
