import { useState, useCallback } from 'react';
import { useGameStore } from '../../state/store';
import { bossRecruitDiscount } from '../../engine/paths';
import { useEconomy, usePlayerCrew } from '../../hooks/useGame';
import { generateDriver } from '../../generators/drivers';
import type { Driver, CarArchetype } from '../../types/game';
import { DriverCard } from '../shared/DriverCard';

const CANDIDATE_COUNT = 3;
const REFRESH_COST = 50; // info cost to refresh candidates
const BASE_HIRE_COST = 150;

function driverCost(driver: Driver, isBoss?: boolean, hasUnderground?: boolean): number {
  const avgStats = (driver.stats.speed + driver.stats.control + driver.stats.aggression + driver.stats.reputation) / 4;
  const baseCost = Math.round(BASE_HIRE_COST + avgStats * 3 + driver.loyalty * 0.5);
  if (isBoss) return bossRecruitDiscount(baseCost, hasUnderground ?? false);
  return baseCost;
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
    const isBoss = game.playerPath === 'boss';
    const hasUnderground = (game.districts.underground?.controlPercent ?? 0) >= 50;
    const cost = driverCost(driver, isBoss, hasUnderground);
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
          const isBoss2 = game.playerPath === 'boss';
          const hasUnderground2 = (game.districts.underground?.controlPercent ?? 0) >= 50;
          const cost = driverCost(driver, isBoss2, hasUnderground2);
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
