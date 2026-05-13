import { useState } from 'react';
import { useGameStore } from '../../state/store';
import { usePlayerDrivers } from '../../hooks/useGame';
import { getDefaultGameState } from '../../state/defaults';
import type { GameState } from '../../types/game';

export function Prestige() {
  const game = useGameStore((s) => s.game);
  const loadGame = useGameStore((s) => s.loadGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const drivers = usePlayerDrivers();

  const [selectedDriver, setSelectedDriver] = useState<string | null>(
    game.prestigeCarryover.signatureDriverKept
  );
  const [confirmed, setConfirmed] = useState(false);

  const currentCarryover = game.prestigeCarryover;
  const controlledDistricts = Object.values(game.districts)
    .filter((d) => d.controlPercent >= 50).length;

  const handlePrestige = () => {
    const defaults = getDefaultGameState();

    // Carry over permanent bonuses
    const nextState: GameState = {
      ...defaults,
      night: game.night + 1,
      prestigeCarryover: {
        garageSlots: currentCarryover.garageSlots + (controlledDistricts >= 2 ? 1 : 0),
        startingCashFloor: currentCarryover.startingCashFloor + 50,
        repMultiplier: currentCarryover.repMultiplier + 0.1,
        signatureDriverKept: selectedDriver,
        permanentUnlocks: [...currentCarryover.permanentUnlocks],
      },
      settings: game.settings,
    };

    // Keep signature driver if selected
    if (selectedDriver && game.drivers[selectedDriver]) {
      const driver = { ...game.drivers[selectedDriver], isSignature: true };
      nextState.drivers = { [driver.id]: driver };
      nextState.crews.player.drivers = [driver.id];
      nextState.crews.player.leaderId = driver.id;
    }

    // Apply starting cash floor
    nextState.economy.cash = Math.max(
      nextState.prestigeCarryover.startingCashFloor,
      nextState.economy.cash
    );

    loadGame(nextState);
    setScreen('city-map');
  };

  // Need at least 50% control in one district to prestige
  const canPrestige = controlledDistricts >= 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">New Night</h1>

      {!canPrestige ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">Control at least 1 district to start a New Night.</p>
          <p className="text-gray-600 text-xs mt-2">
            You control {controlledDistricts}/6 districts.
          </p>
        </div>
      ) : (
        <>
          {/* Current night summary */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-4">
            <div className="text-sm text-neon-pink">Night {game.night} complete</div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>Districts controlled: {controlledDistricts}/6</div>
              <div>Cash: ${game.economy.cash}</div>
              <div>Rep: {game.economy.rep}</div>
              <div>Races completed: {game.completedRaceIds.length}</div>
            </div>
          </div>

          {/* What carries over */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-4">
            <h2 className="text-sm text-neon-cyan mb-2">Carryover Bonuses</h2>
            <div className="text-xs text-gray-400 space-y-1">
              <div>🏠 Garage slots: {currentCarryover.garageSlots} → {currentCarryover.garageSlots + (controlledDistricts >= 2 ? 1 : 0)}</div>
              <div>💰 Starting cash floor: ${currentCarryover.startingCashFloor} → ${currentCarryover.startingCashFloor + 50}</div>
              <div>⭐ Rep multiplier: {currentCarryover.repMultiplier.toFixed(1)}x → {(currentCarryover.repMultiplier + 0.1).toFixed(1)}x</div>
              {selectedDriver && (
                <div className="text-neon-pink">🏎️ Signature driver: {game.drivers[selectedDriver]?.name || 'Unknown'}</div>
              )}
            </div>
          </div>

          {/* Signature driver selection */}
          {drivers.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">
                Keep a Signature Driver
              </label>
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
                    {d.name} — {d.personality}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedDriver(null)}
                  className={`text-left p-2 rounded border text-sm ${
                    selectedDriver === null
                      ? 'border-neon-cyan bg-neon-cyan/10'
                      : 'border-neon-cyan/20 bg-midnight'
                  }`}
                >
                  None (fresh start)
                </button>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              className="w-full py-3 bg-neon-pink text-black font-bold rounded hover:bg-neon-pink/80 transition-colors"
            >
              Begin New Night
            </button>
          ) : (
            <div className="space-y-2">
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                <p className="text-sm text-red-400">
                  This will reset your crew, cars, and territory.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Permanent bonuses and your signature driver will carry over.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmed(false)}
                  className="flex-1 py-3 border border-neon-cyan/20 text-gray-400 rounded hover:border-neon-cyan/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrestige}
                  className="flex-1 py-3 bg-neon-pink text-black font-bold rounded hover:bg-neon-pink/80 transition-colors"
                >
                  Confirm New Night
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
