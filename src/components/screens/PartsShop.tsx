import { useState } from 'react';
import { useGameStore } from '../../state/store';
import { usePlayerCars, useEconomy } from '../../hooks/useGame';
import type { Car, Part, CarClass, CarStats, Parts } from '../../types/game';

// --- Parts Catalog ---

type PartSlot = keyof Parts;

interface PartTemplate {
  slot: PartSlot;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  statBonus: Partial<CarStats>;
  sideEffect?: string;
  baseCost: number;
}

const PARTS_CATALOG: PartTemplate[] = [
  // Tier 1
  { slot: 'engine', name: 'Street Cam', tier: 1, statBonus: { topSpeed: 5 }, baseCost: 100 },
  { slot: 'tires', name: 'All-Seasons', tier: 1, statBonus: { control: 5 }, baseCost: 80 },
  { slot: 'suspension', name: 'Sport Springs', tier: 1, statBonus: { control: 3, durability: 3 }, baseCost: 120 },
  { slot: 'nitro', name: 'Squeeze Bottle', tier: 1, statBonus: { aggression: 10 }, sideEffect: '−5 durability', baseCost: 200 },
  { slot: 'aero', name: 'Front Lip', tier: 1, statBonus: { topSpeed: 2, control: 2 }, baseCost: 150 },
  // Tier 2
  { slot: 'engine', name: 'Cold Air Intake', tier: 2, statBonus: { topSpeed: 10 }, baseCost: 350 },
  { slot: 'tires', name: 'Sport Compounds', tier: 2, statBonus: { control: 10 }, baseCost: 280 },
  { slot: 'suspension', name: 'Coilovers', tier: 2, statBonus: { control: 7, durability: 7 }, baseCost: 400 },
  { slot: 'nitro', name: 'Wet Shot', tier: 2, statBonus: { aggression: 20 }, sideEffect: '−10 durability', baseCost: 500 },
  { slot: 'aero', name: 'Ducktail Spoiler', tier: 2, statBonus: { topSpeed: 4, control: 4 }, baseCost: 400 },
  // Tier 3
  { slot: 'engine', name: 'Turbo Kit', tier: 3, statBonus: { topSpeed: 15 }, baseCost: 800 },
  { slot: 'tires', name: 'Semi-Slicks', tier: 3, statBonus: { control: 15 }, baseCost: 650 },
  { slot: 'suspension', name: 'Track Coilovers', tier: 3, statBonus: { control: 10, durability: 10 }, baseCost: 900 },
  { slot: 'nitro', name: 'Direct Port', tier: 3, statBonus: { aggression: 30 }, sideEffect: '−15 durability', baseCost: 1100 },
  { slot: 'aero', name: 'GT Wing', tier: 3, statBonus: { topSpeed: 6, control: 6 }, baseCost: 850 },
  // Tier 4
  { slot: 'engine', name: 'Big Turbo', tier: 4, statBonus: { topSpeed: 20 }, baseCost: 1600 },
  { slot: 'tires', name: 'Racing Slicks', tier: 4, statBonus: { control: 20 }, baseCost: 1300 },
  { slot: 'suspension', name: 'Remote Reservoir', tier: 4, statBonus: { control: 14, durability: 14 }, baseCost: 1800 },
  { slot: 'nitro', name: 'Dual Stage', tier: 4, statBonus: { aggression: 40 }, sideEffect: '−20 durability', baseCost: 2200 },
  { slot: 'aero', name: 'Full Aero Kit', tier: 4, statBonus: { topSpeed: 8, control: 8 }, baseCost: 1700 },
  // Tier 5
  { slot: 'engine', name: 'Race Engine Swap', tier: 5, statBonus: { topSpeed: 25 }, baseCost: 3000 },
  { slot: 'tires', name: 'Qualifying Compounds', tier: 5, statBonus: { control: 25 }, baseCost: 2500 },
  { slot: 'suspension', name: 'Full Rose-Jointed', tier: 5, statBonus: { control: 18, durability: 18 }, baseCost: 3500 },
  { slot: 'nitro', name: 'Custom Mix', tier: 5, statBonus: { aggression: 50 }, sideEffect: '−25 durability', baseCost: 4000 },
  { slot: 'aero', name: 'Wind Tunnel Spec', tier: 5, statBonus: { topSpeed: 10, control: 10 }, baseCost: 3200 },
];

function costForClass(baseCost: number, carClass: CarClass): number {
  const mult = { C: 1, B: 1.3, A: 1.6, S: 2 }[carClass];
  return Math.round(baseCost * mult);
}

// --- Component ---

export function PartsShop() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const cars = usePlayerCars();
  const economy = useEconomy();
  const setScreen = useGameStore((s) => s.setScreen);

  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id ?? '');
  const [filterSlot, setFilterSlot] = useState<PartSlot | 'all'>('all');
  const [feedback, setFeedback] = useState('');

  const car = game.cars[selectedCarId];

  const buyPart = (template: PartTemplate) => {
    if (!car) return;
    const cost = costForClass(template.baseCost, car.class);
    if (economy.cash < cost) {
      setFeedback(`Need $${cost} for ${template.name}.`);
      return;
    }

    const part: Part = {
      id: `part-${template.slot}-${Date.now()}`,
      name: template.name,
      tier: template.tier,
      statBonus: template.statBonus,
      sideEffect: template.sideEffect,
    };

    const updatedParts = { ...car.parts, [template.slot]: part };
    const updatedCar: Car = { ...car, parts: updatedParts };
    updateGame({
      cars: { ...game.cars, [car.id]: updatedCar },
      economy: { ...economy, cash: economy.cash - cost },
    });
    setFeedback(`Installed ${template.name}!`);
    setTimeout(() => setFeedback(''), 1500);
  };

  if (cars.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Parts Shop</h1>
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No cars to upgrade.</p>
          <button onClick={() => setScreen('car-market')} className="mt-4 px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded">
            Browse Car Market
          </button>
        </div>
      </div>
    );
  }

  // Show installed parts summary for selected car
  const installedSlots = car ? Object.entries(car.parts).filter(([, p]) => p !== null) as [PartSlot, Part][] : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Parts Shop</h1>
        <span className="text-xs text-neon-amber">${economy.cash}</span>
      </div>

      {/* Car selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cars.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCarId(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded border text-xs ${
              selectedCarId === c.id
                ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
            }`}
          >
            {c.name} (Class {c.class})
          </button>
        ))}
      </div>

      {feedback && (
        <div className="rounded p-2 text-xs text-center bg-green-500/10 text-green-400 border border-green-500/30">
          {feedback}
        </div>
      )}

      {/* Installed parts */}
      {installedSlots.length > 0 && (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Installed</h3>
          <div className="flex flex-wrap gap-1.5">
            {installedSlots.map(([slot, part]) => (
              <span key={slot} className="text-[10px] px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                {slot}: {part.name} (T{part.tier})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slot filter */}
      <div className="flex gap-2 overflow-x-auto">
        {(['all', 'engine', 'tires', 'suspension', 'nitro', 'aero'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterSlot(s)}
            className={`flex-shrink-0 px-3 py-1 rounded border text-xs ${
              filterSlot === s
                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
            }`}
          >
            {s === 'all' ? 'All Slots' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Parts catalog */}
      <div className="grid gap-2">
        {PARTS_CATALOG.filter((p) => filterSlot === 'all' || p.slot === filterSlot).map((part) => {
          const cost = car ? costForClass(part.baseCost, car.class) : part.baseCost;
          const canAfford = economy.cash >= cost;
          const tierColor =
            part.tier >= 5 ? 'text-neon-pink' :
            part.tier >= 4 ? 'text-purple-400' :
            part.tier >= 3 ? 'text-neon-amber' :
            part.tier >= 2 ? 'text-green-400' : 'text-gray-400';

          return (
            <div key={`${part.slot}-${part.name}`} className="bg-midnight border border-neon-cyan/20 rounded p-3 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neon-cyan">{part.name}</span>
                  <span className={`text-[10px] font-bold ${tierColor}`}>T{part.tier}</span>
                  <span className="text-[10px] text-gray-600 uppercase">{part.slot}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {Object.entries(part.statBonus).map(([stat, val]) => (
                    <span key={stat} className="mr-2">+{val} {stat}</span>
                  ))}
                  {part.sideEffect && <span className="text-red-400 ml-1">{part.sideEffect}</span>}
                </div>
              </div>
              <button
                onClick={() => buyPart(part)}
                disabled={!canAfford}
                className={`text-xs px-3 py-1.5 rounded font-bold ${
                  canAfford
                    ? 'bg-neon-pink text-black hover:bg-neon-pink/80'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                ${cost}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
