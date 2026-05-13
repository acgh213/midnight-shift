import { useEffect, useState } from 'react';
import { useGameStore } from '../../state/store';
import type { RaceResult, RaceEvent } from '../../types/game';
import { simulateRace } from '../../engine/simulator';
import { applyRaceResult } from '../../engine/economy';
import { useAudio } from '../../hooks/useAudio';

export function RaceLive() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const logDebug = useGameStore((s) => s.logDebug);
  const setScreen = useGameStore((s) => s.setScreen);
  const activeRaces = game.activeRaces;
  const [liveEvents, setLiveEvents] = useState<RaceEvent[]>([]);
  const [completedRaces, setCompletedRaces] = useState<RaceResult[]>([]);
  const { playEngine, playCrash, playFinish } = useAudio();

  useEffect(() => {
    logDebug('RaceLive:useEffect triggered', { activeRacesCount: activeRaces.length });

    if (activeRaces.length === 0) {
      logDebug('RaceLive: no active races, returning');
      return;
    }

    const race = activeRaces[0];
    logDebug('RaceLive: processing race', { raceId: race.id, stakes: race.stakes, length: race.length, district: race.districtId });

    const district = game.districts[race.districtId];
    if (!district) {
      logDebug('RaceLive: district not found, aborting', { districtId: race.districtId });
      return;
    }

    logDebug('RaceLive: calling playEngine');
    playEngine();

    if (race.length === '5m' || race.length === '30m') {
      logDebug('RaceLive: short race, running simulation', { length: race.length });
      const result = simulateRace(race, game.drivers, game.cars, district);
      logDebug('RaceLive: simulation complete', {
        outcome: result.outcome,
        cash: result.rewards.cash,
        rep: result.rewards.rep,
        districtChange: result.districtControlChange,
        eventsCount: result.events.length,
      });
      setLiveEvents(result.events);

      const hasCrash = result.events.some((e) => e.type === 'CRASH_OUT' || e.type === 'CRASH_RECOVER');
      if (hasCrash) setTimeout(() => playCrash(), 500);

      const totalTime = race.length === '5m' ? 3000 : 5000;
      logDebug('RaceLive: setting timeout', { totalTimeMs: totalTime });

      const timer = setTimeout(() => {
        logDebug('RaceLive: timeout fired, applying result', { raceId: race.id });
        try {
          const newState = applyRaceResult(game, result, race);
          logDebug('RaceLive: applyRaceResult SUCCESS', {
            outcome: result.outcome,
            cashBefore: game.economy.cash,
            cashAfter: newState.economy.cash,
            districtBefore: game.districts[race.districtId]?.controlPercent,
            districtAfter: newState.districts[race.districtId]?.controlPercent,
            completedBefore: game.completedRaceIds.length,
            completedAfter: newState.completedRaceIds.length,
            activeBefore: game.activeRaces.length,
            activeAfter: newState.activeRaces.length,
          });
          setCompletedRaces((prev) => [...prev, result]);
          setLiveEvents([]);
          playFinish();
          logDebug('RaceLive: calling updateGame');
          updateGame(newState);
          logDebug('RaceLive: updateGame returned');
        } catch (err) {
          logDebug('RaceLive: applyRaceResult FAILED', { error: String(err), stack: (err as Error).stack });
          console.error('[RaceLive] applyRaceResult FAILED:', err);
        }
      }, totalTime);

      return () => {
        logDebug('RaceLive: effect cleanup — clearing timeout', { raceId: race.id });
        clearTimeout(timer);
      };
    } else {
      logDebug('RaceLive: long race, not simulating inline', { length: race.length });
    }
  }, [activeRaces, game, updateGame, playEngine, playCrash, playFinish, logDebug]);

  if (activeRaces.length === 0 && completedRaces.length === 0) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">No active races.</p>
        <p className="text-gray-600 text-xs mt-2">Set up a race to get started.</p>
        <button
          onClick={() => setScreen('race-setup')}
          className="mt-4 px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80"
        >
          Set Up Race
        </button>
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
                <span className={
                  event.type === 'OVERTAKE' ? 'text-neon-cyan' :
                  event.type === 'CRASH_OUT' || event.type === 'CRASH_RECOVER' ? 'text-red-400' :
                  event.type === 'FINISH' ? 'text-neon-pink' :
                  event.type === 'NEAR_MISS' ? 'text-neon-amber' :
                  event.type === 'MECHANICAL' ? 'text-purple-400' :
                  'text-gray-400'
                }>
                  {event.type === 'OVERTAKE' && 'Overtake!'}
                  {event.type === 'NEAR_MISS' && 'Near Miss!'}
                  {event.type === 'CRASH_RECOVER' && 'Crash & Recover'}
                  {event.type === 'CRASH_OUT' && '💥 Crash Out!'}
                  {event.type === 'MECHANICAL' && 'Mechanical Issue'}
                  {event.type === 'FINISH' && '🏁 Finish!'}
                </span>
                <span className="text-gray-600"> — {event.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed races */}
      {completedRaces.map((result) => {
        const driverId = game.drivers && Object.keys(game.drivers)[0];
        const driver = driverId ? game.drivers[driverId] : null;

        return (
          <div key={result.raceId} className="bg-midnight border border-neon-cyan/30 rounded p-4">
            <h2 className="text-lg font-bold text-neon-cyan">Race Complete</h2>
            {result.narrative && (
              <p className="text-sm text-gray-300 mt-1 italic leading-relaxed">{result.narrative}</p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Result: </span>
                <span className={result.outcome === 'win' ? 'text-green-400' : result.outcome === 'draw' ? 'text-neon-amber' : 'text-red-400'}>
                  {result.outcome.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Position: </span>
                <span className="text-neon-cyan">{result.position}</span>
              </div>
              <div>
                <span className="text-gray-500">Cash: </span>
                <span className="text-green-400">+${result.rewards.cash}</span>
              </div>
              <div>
                <span className="text-gray-500">Rep: </span>
                <span className="text-neon-pink">+{result.rewards.rep}</span>
              </div>
              <div>
                <span className="text-gray-500">Info: </span>
                <span className="text-purple-400">+{result.rewards.info}</span>
              </div>
              <div>
                <span className="text-gray-500">District: </span>
                <span className={result.districtControlChange > 0 ? 'text-green-400' : 'text-gray-400'}>
                  {result.districtControlChange > 0 ? `+${result.districtControlChange}%` : '—'}
                </span>
              </div>
            </div>
            {driver && (
              <div className="mt-2 text-xs text-gray-500">
                Driver: {driver.name} {driver.nickname ? `"${driver.nickname}"` : ''}
              </div>
            )}
            <button
              onClick={() => setScreen('race-setup')}
              className="mt-3 w-full py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80"
            >
              Race Again
            </button>
          </div>
        );
      })}
    </div>
  );
}
