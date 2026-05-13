import { useGameStore } from '../../state/store';
import { useDistricts, usePlayerCars, usePlayerDrivers } from '../../hooks/useGame';
import type { DistrictId } from '../../types/game';

export function CityMap() {
  const districts = useDistricts();
  const setScreen = useGameStore((s) => s.setScreen);
  const activeRaces = useGameStore((s) => s.game.activeRaces);
  const crews = useGameStore((s) => s.game.crews);
  const night = useGameStore((s) => s.game.night);
  const economy = useGameStore((s) => s.game.economy);
  const drivers = usePlayerDrivers();
  const cars = usePlayerCars();

  const canRace = drivers.length > 0 && cars.length > 0;

  const getRivalName = (districtId: DistrictId): string => {
    const district = districts[districtId];
    if (!district) return 'Unknown';
    const crew = crews[district.rivalCrewId];
    return crew?.name || 'Unknown Crew';
  };

  const activeRaceForDistrict = (districtId: DistrictId) => {
    return activeRaces.find((r) => r.districtId === districtId);
  };

  const handleDistrictClick = (_districtId: DistrictId) => {
    if (canRace) {
      setScreen('race-setup');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">City Map</h1>

      {/* Player status bar */}
      <div className="bg-midnight border border-neon-cyan/20 rounded p-3 flex justify-between items-center text-xs">
        <div>
          <span className="text-gray-500">Night </span>
          <span className="text-neon-pink">{night}</span>
        </div>
        <div>
          <span className="text-gray-500">Cash </span>
          <span className="text-neon-amber">${economy.cash}</span>
        </div>
        <div>
          <span className="text-gray-500">Rep </span>
          <span className="text-neon-cyan">{economy.rep}</span>
        </div>
        <div>
          <span className="text-gray-500">Drivers </span>
          <span className="text-gray-300">{drivers.length}</span>
        </div>
        <div>
          <span className="text-gray-500">Cars </span>
          <span className="text-gray-300">{cars.length}</span>
        </div>
      </div>

      {/* District grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(districts).map(([id, d]) => {
          const rivalName = getRivalName(id as DistrictId);
          const activeRace = activeRaceForDistrict(id as DistrictId);
          const controlColor =
            d.controlPercent >= 100 ? 'bg-neon-pink' :
            d.controlPercent > 50 ? 'bg-neon-cyan' :
            d.controlPercent > 0 ? 'bg-neon-amber' : 'bg-pavement';

          return (
            <div
              key={id}
              onClick={() => handleDistrictClick(id as DistrictId)}
              className={`bg-midnight border rounded p-3 transition-colors ${
                canRace
                  ? 'cursor-pointer hover:border-neon-pink/50 border-neon-cyan/20'
                  : 'border-neon-cyan/10 opacity-60'
              } ${activeRace ? 'border-neon-pink/50' : ''}`}
            >
              {/* District name and rival */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-neon-cyan">{d.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{rivalName}</div>
                </div>
                {activeRace && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-pink/20 text-neon-pink">
                    RACING
                  </span>
                )}
              </div>

              {/* Control bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                  <span>Control</span>
                  <span>{d.controlPercent}%</span>
                </div>
                <div className="h-1.5 bg-pavement rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${controlColor}`}
                    style={{ width: `${d.controlPercent}%` }}
                  />
                </div>
              </div>

              {/* Perk */}
              <div className="mt-2 text-[10px] text-gray-500">
                <span className="text-neon-amber">{d.perk.name}</span>: {d.perk.description}
              </div>

              {/* Road type hint */}
              <div className="mt-1 text-[9px] text-gray-600 italic">
                {d.roadType}
              </div>
            </div>
          );
        })}
      </div>

      {!canRace && (
        <div className="bg-midnight border border-neon-amber/20 rounded p-3 text-center">
          <p className="text-xs text-neon-amber">Recruit a driver and get a car to start racing.</p>
        </div>
      )}
    </div>
  );
}
