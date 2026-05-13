import { useEffect, useState } from 'react';
import { useGameStore } from '../../state/store';
import type { RaceResult, RaceEvent } from '../../types/game';
import { simulateRace } from '../../engine/simulator';

export function RaceLive() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const activeRaces = game.activeRaces;
  const [liveEvents, setLiveEvents] = useState<RaceEvent[]>([]);
  const [completedRaces, setCompletedRaces] = useState<RaceResult[]>([]);

  useEffect(() => {
    if (activeRaces.length === 0) return;

    const race = activeRaces[0];
    const district = game.districts[race.districtId];

    // For short races, simulate and show events gradually
    if (race.length === '5m' || race.length === '30m') {
      const result = simulateRace(race, game.drivers, game.cars, district);
      setLiveEvents(result.events);

      // After all events shown, mark as completed
      const totalTime = race.length === '5m' ? 3000 : 5000; // speed up for demo
      const timer = setTimeout(() => {
        setCompletedRaces((prev) => [...prev, result]);
        const newRaces = activeRaces.filter((r) => r.id !== race.id);
        setLiveEvents([]);
        updateGame({
          activeRaces: newRaces,
          raceResults: { ...game.raceResults, [result.raceId]: result },
          completedRaceIds: [...game.completedRaceIds, result.raceId],
        });
      }, totalTime);

      return () => clearTimeout(timer);
    }
  }, []);

  if (activeRaces.length === 0 && completedRaces.length === 0) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">No active races.</p>
        <p className="text-gray-600 text-xs mt-2">Set up a race to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Race Live</h1>

      {/* Active race info */}
      {activeRaces.length > 0 && (
        <div className="bg-midnight border border-neon-pink/30 rounded p-4">
          <div className="text-sm text-neon-pink">Race in progress...</div>
          <div className="text-xs text-gray-500 mt-1">
            District: {game.districts[activeRaces[0].districtId]?.name} · Stakes: {activeRaces[0].stakes}
          </div>
          {/* Event log */}
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
            {liveEvents.map((event, i) => (
              <div key={i} className="text-gray-400">
                <span className="text-gray-600">[{event.tick}]</span>{' '}
                {event.type === 'OVERTAKE' && '🚗 Overtake!'}
                {event.type === 'FINISH' && '🏁 Race finished!'}
                {' — '}{event.location}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed races */}
      {completedRaces.map((result) => (
        <div key={result.raceId} className="bg-midnight border border-neon-cyan/20 rounded p-4">
          <div className={`text-sm font-bold ${result.outcome === 'win' ? 'text-green-400' : result.outcome === 'draw' ? 'text-neon-amber' : 'text-red-400'}`}>
            {result.outcome.toUpperCase()}!
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +${result.rewards.cash} · +{result.rewards.rep} Rep · +{result.districtControlChange}% Control
          </div>
        </div>
      ))}
    </div>
  );
}
