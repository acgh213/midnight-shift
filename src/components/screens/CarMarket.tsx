import { useState } from 'react';
import { useGameStore } from '../../state/store';
import { useEconomy, usePlayerCrew, usePlayerCars } from '../../hooks/useGame';
import { heroCars } from '../../content/cars/hero-cars';
import { CarCard } from '../shared/CarCard';
import type { Car, CarClass } from '../../types/game';

const CLASS_PRICES: Record<CarClass, number> = {
  C: 200,
  B: 500,
  A: 1200,
  S: 3000,
};

const CLASS_COLORS: Record<CarClass, string> = {
  C: 'text-gray-400',
  B: 'text-green-400',
  A: 'text-amber-400',
  S: 'text-neon-pink',
};

export function CarMarket() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const economy = useEconomy();
  const crew = usePlayerCrew();
  const ownedCars = usePlayerCars();

  const [filter, setFilter] = useState<CarClass | 'all'>('all');
  const [feedback, setFeedback] = useState('');

  const ownedIds = new Set(ownedCars.map((c) => c.name));
  const displayed = filter === 'all'
    ? heroCars
    : heroCars.filter((c) => c.class === filter);

  const buy = (template: Car) => {
    const price = CLASS_PRICES[template.class];
    if (economy.cash < price) {
      setFeedback(`Not enough cash. The ${template.name} costs $${price}.`);
      return;
    }

    const id = `car-${template.id}-${Date.now()}`;
    const car: Car = {
      ...template,
      id,
      ownerId: 'player',
    };

    updateGame({
      economy: { ...economy, cash: economy.cash - price },
      cars: { ...game.cars, [id]: car },
      crews: {
        ...game.crews,
        player: { ...crew, cars: [...crew.cars, id] },
      },
    });
    setFeedback(`${template.name} added to your garage.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Car Market</h1>
        <span className="text-xs text-neon-amber">${economy.cash}</span>
      </div>

      <p className="text-xs text-gray-500 italic">
        A dimly lit import lot behind the docks. Container-shipped metal, some still 
        wearing overseas plates. The dealer doesn't ask questions. Neither should you.
      </p>

      {feedback && (
        <div className="bg-neon-pink/10 border border-neon-pink/30 rounded p-2 text-xs text-neon-pink">
          {feedback}
        </div>
      )}

      {/* Class filter */}
      <div className="flex gap-2">
        {(['all', 'C', 'B', 'A', 'S'] as const).map((cls) => (
          <button
            key={cls}
            onClick={() => setFilter(cls)}
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              filter === cls
                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
            }`}
          >
            {cls === 'all' ? 'All' : `Class ${cls}`}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {displayed.map((car) => {
          const price = CLASS_PRICES[car.class];
          const alreadyOwned = ownedIds.has(car.name);
          const canAfford = economy.cash >= price;

          return (
            <div
              key={car.id}
              className={`bg-midnight border rounded overflow-hidden ${
                alreadyOwned ? 'border-gray-700 opacity-60' : 'border-neon-cyan/20'
              }`}
            >
              <CarCard car={car} />
              <div className="px-3 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${CLASS_COLORS[car.class]}`}>
                    Class {car.class}
                  </span>
                  <span className="text-xs text-gray-500">{car.archetype}</span>
                  {alreadyOwned && (
                    <span className="text-[10px] text-gray-600 italic">already owned</span>
                  )}
                </div>
                <button
                  onClick={() => buy(car)}
                  disabled={!canAfford}
                  className={`text-xs px-4 py-1.5 rounded font-bold transition-colors ${
                    canAfford
                      ? 'bg-neon-pink text-black hover:bg-neon-pink/80'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {alreadyOwned ? 'Buy Another' : 'Buy'} — ${price}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
