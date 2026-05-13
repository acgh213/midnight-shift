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
