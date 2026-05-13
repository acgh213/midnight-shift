import { useGameStore } from '../../state/store';
import { generateBossVision } from '../../engine/paths';
import { useDistricts, usePlayerCars, usePlayerDrivers } from '../../hooks/useGame';
import { participateInEvent } from '../../engine/events';
import type { DistrictId } from '../../types/game';

export function CityMap() {
  const districts = useDistricts();
  const setScreen = useGameStore((s) => s.setScreen);
  const game = useGameStore((s) => s.game);
  const bossVision = game.playerPath === 'boss'
    ? generateBossVision(game.crews, game.districts, game.economy.rep, game.night)
    : null;
  const updateGame = useGameStore((s) => s.updateGame);
  const activeRaces = game.activeRaces;
  const crews = game.crews;
  const night = game.night;
  const economy = game.economy;
  const drivers = usePlayerDrivers();
  const cars = usePlayerCars();
  const events = game.specialEvents || [];

  const canRace = drivers.length > 0 && cars.length > 0;

  if (!districts || !crews) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">Loading game state...</p>
      </div>
    );
  }

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

      {/* Boss Vision */}
      {bossVision && bossVision.length > 0 && (
        <div className="bg-midnight border border-neon-pink/20 rounded p-3">
          <h2 className="text-xs text-neon-pink uppercase tracking-wider mb-2">Boss Vision</h2>
          <div className="space-y-2">
            {bossVision.slice(0, 4).map((v) => (
              <div key={v.districtId} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 w-28 truncate">
                  {game.districts[v.districtId]?.name ?? v.districtId}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${v.heatLevel}%`,
                      background: v.heatLevel > 70 ? '#ef4444' : v.heatLevel > 40 ? '#f59e0b' : '#22c55e',
                    }} />
                  </div>
                  <span className="text-gray-500 w-8 text-right text-[10px]">
                    {v.heatLevel}%
                  </span>
                  {v.nextChallengeIn < 2 && (
                    <span className="text-red-400 text-[10px]">⚠ soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City Events */}
      {events.filter((e) => !e.resolved).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs text-gray-500 uppercase tracking-wider">City Events</h2>
          {events.filter((e) => !e.resolved).map((event) => {
            const handleParticipate = () => {
              const { cashDelta, repDelta, infoDelta, result } = participateInEvent(event, game);
              const updatedEvent = { ...event, resolved: true, result };
              updateGame({
                specialEvents: events.map((e) => (e.id === event.id ? updatedEvent : e)),
                economy: {
                  ...economy,
                  cash: economy.cash + cashDelta,
                  rep: economy.rep + repDelta,
                  info: economy.info + infoDelta,
                },
              });
            };

            return (
              <div
                key={event.id}
                className="bg-midnight border rounded p-3"
                style={{ borderColor: event.risk === 'high' ? '#ff2d9544' : event.risk === 'medium' ? '#ffb80044' : '#00d4ff44' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-neon-cyan">{event.title}</span>
                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded ${
                      event.risk === 'high' ? 'bg-red-500/20 text-red-400' :
                      event.risk === 'medium' ? 'bg-neon-amber/20 text-neon-amber' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {event.risk.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{event.districtName}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-[10px] text-gray-600">
                    ${event.rewards.cash} · {event.rewards.rep} rep · {event.rewards.info} info
                  </div>
                  {!event.autoResolve && (
                    <button
                      onClick={handleParticipate}
                      className="px-3 py-1 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
