import { useState, useCallback } from 'react';
import { useGameStore } from '../../state/store';
import { useEconomy, usePlayerCrew } from '../../hooks/useGame';
import { generateDriver } from '../../generators/drivers';
import type { Driver, CarArchetype } from '../../types/game';
import { DriverCard } from '../shared/DriverCard';

const CANDIDATE_COUNT = 3;
const REFRESH_COST = 50; // info cost to refresh candidates
const BASE_HIRE_COST = 150;

function driverCost(driver: Driver): number {
  const avgStats = (driver.stats.speed + driver.stats.control + driver.stats.aggression + driver.stats.reputation) / 4;
  return Math.round(BASE_HIRE_COST + avgStats * 3 + driver.loyalty * 0.5);
}

export function Junkyard() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const economy = useEconomy();
  const crew = usePlayerCrew();

  const [seed, setSeed] = useState(() => Date.now());
  const [feedback, setFeedback] = useState('');

  const candidates: Driver[] = Array.from({ length: CANDIDATE_COUNT }, (_, i) =>
    generateDriver(seed + i, 'player', 'jdm-tuner' as CarArchetype)
  );

  const refresh = useCallback(() => {
    if (economy.info < REFRESH_COST) {
      setFeedback(`Need ${REFRESH_COST} info to scout new talent.`);
      return;
    }
    updateGame({ economy: { ...economy, info: economy.info - REFRESH_COST } });
    setSeed(Date.now());
    setFeedback('');
  }, [economy, updateGame]);

  const hire = useCallback((driver: Driver) => {
    const cost = driverCost(driver);
    if (economy.cash < cost) {
      setFeedback(`Not enough cash. Hiring ${driver.name} costs $${cost}.`);
      return;
    }

    const hired = { ...driver, crewId: 'player' as const };
    updateGame({
      economy: { ...economy, cash: economy.cash - cost },
      drivers: { ...game.drivers, [hired.id]: hired },
      crews: {
        ...game.crews,
        player: { ...crew, drivers: [...crew.drivers, hired.id] },
      },
    });
    setFeedback(`${driver.name} joined Midnight Shift.`);
    setSeed(Date.now()); // refresh candidates after hire
  }, [economy, game, crew, updateGame]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Junkyard</h1>
        <div className="flex gap-3 text-xs">
          <span className="text-neon-amber">${economy.cash}</span>
          <span className="text-purple-400">● {economy.info}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">
        A cluster of barrel fires and half-stripped chassis. Drivers come here between crews, 
        between paychecks, between lives. Some are desperate. Some are dangerous. All of them 
        can drive.
      </p>

      {feedback && (
        <div className="bg-neon-pink/10 border border-neon-pink/30 rounded p-2 text-xs text-neon-pink">
          {feedback}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Available talent</span>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 rounded border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
        >
          Scout (● {REFRESH_COST})
        </button>
      </div>

      <div className="grid gap-3">
        {candidates.map((driver) => {
          const cost = driverCost(driver);
          const canAfford = economy.cash >= cost;
          return (
            <div key={driver.id} className="bg-midnight border border-neon-cyan/20 rounded overflow-hidden">
              <DriverCard driver={{ ...driver, crewId: 'player' }} />
              <div className="px-3 pb-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">{driver.backstory}</span>
                <button
                  onClick={() => hire(driver)}
                  disabled={!canAfford}
                  className={`text-xs px-4 py-1.5 rounded font-bold transition-colors ${
                    canAfford
                      ? 'bg-neon-pink text-black hover:bg-neon-pink/80'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Hire — ${cost}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
