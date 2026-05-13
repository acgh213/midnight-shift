import { usePlayerDrivers } from '../../hooks/useGame';
import { useGameStore } from '../../state/store';
import { DriverCard } from '../shared/DriverCard';

export function CrewRoster() {
  const drivers = usePlayerDrivers();
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Crew</h1>
      {drivers.length === 0 ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No drivers recruited yet.</p>
          <p className="text-gray-600 text-xs mt-2">Find talent at the Junkyard or poach from rivals.</p>
          <button
            onClick={() => setScreen('junkyard')}
            className="mt-4 px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80 transition-colors"
          >
            Visit Junkyard
          </button>
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
