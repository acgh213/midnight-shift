import { useState } from 'react';
import { useGameStore } from '../../state/store';
import { usePlayerCars, useEconomy } from '../../hooks/useGame';
import type { Car, CarCosmetics } from '../../types/game';

const PAINT_COLORS = [
  '#ffff00', // yellow
  '#ff2d95', // neon pink
  '#00d4ff', // neon cyan
  '#b347ea', // neon purple
  '#ffb800', // amber
  '#00ff88', // green
  '#ff4400', // orange
  '#333333', // dark grey
  '#ffffff', // white
  '#000000', // black
  '#cc0000', // red
  '#1a3a5c', // navy
  '#8b4513', // brown
  '#ffd700', // gold
  '#ff69b4', // hot pink
  '#e8e8e8', // silver
];

const NEON_COLORS = [
  { label: 'None', value: '' },
  { label: 'Pink', value: '#ff2d95' },
  { label: 'Cyan', value: '#00d4ff' },
  { label: 'Purple', value: '#b347ea' },
  { label: 'Amber', value: '#ffb800' },
  { label: 'Green', value: '#00ff88' },
  { label: 'Red', value: '#ff0000' },
];

const DECAL_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Racing Stripe', value: 'stripe' },
  { label: 'Flames', value: 'flames' },
  { label: 'Number', value: 'number' },
  { label: 'Crew Logo', value: 'logo' },
  { label: 'Hex Pattern', value: 'hex' },
];

const BODY_KITS = [
  { label: 'Stock', value: '' },
  { label: 'Widebody', value: 'widebody' },
  { label: 'Drift Spec', value: 'drift' },
  { label: 'Drag Spec', value: 'drag' },
  { label: 'Rally Armor', value: 'rally' },
];

const CUSTOMIZE_COST = 25;

export function Customization() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const cars = usePlayerCars();
  const economy = useEconomy();
  const setScreen = useGameStore((s) => s.setScreen);

  const [selectedCarId, setSelectedCarId] = useState<string>(cars[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');

  const car = game.cars[selectedCarId];
  const cosmetics = car?.cosmetics;

  const updateCosmetics = (partial: Partial<CarCosmetics>) => {
    if (!car || economy.cash < CUSTOMIZE_COST) {
      setFeedback(`Need $${CUSTOMIZE_COST} for customization.`);
      return;
    }
    const updated: Car = {
      ...car,
      cosmetics: { ...car.cosmetics, ...partial },
    };
    updateGame({
      cars: { ...game.cars, [car.id]: updated },
      economy: { ...economy, cash: economy.cash - CUSTOMIZE_COST },
    });
    setFeedback('Applied!');
    setTimeout(() => setFeedback(''), 1500);
  };

  if (cars.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Customization</h1>
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No cars to customize.</p>
          <button
            onClick={() => setScreen('car-market')}
            className="mt-4 px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded"
          >
            Browse Car Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Customization</h1>
        <span className="text-xs text-neon-amber">${economy.cash} (${CUSTOMIZE_COST}/change)</span>
      </div>

      {/* Car selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cars.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCarId(c.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded border text-xs transition-colors ${
              selectedCarId === c.id
                ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`rounded p-2 text-xs text-center ${
          feedback === 'Applied!' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
        }`}>
          {feedback}
        </div>
      )}

      {car && cosmetics && (
        <>
          {/* Car preview */}
          <div
            className="rounded-lg p-6 border-2 border-neon-cyan/30"
            style={{
              backgroundColor: '#0a0a0f',
              borderColor: cosmetics.neonColor || '#00d4ff33',
              boxShadow: cosmetics.neonColor ? `0 0 30px ${cosmetics.neonColor}22, inset 0 0 30px ${cosmetics.neonColor}11` : undefined,
            }}
          >
            {/* Car body */}
            <div
              className="mx-auto rounded-t-lg rounded-b-md relative"
              style={{
                width: '200px',
                height: '80px',
                backgroundColor: cosmetics.paint || '#ffff00',
                boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Windshield */}
              <div className="absolute top-2 right-6 w-12 h-8 bg-gray-800 rounded-t-sm" 
                style={{ opacity: 0.7 }} 
              />
              {/* Wheels */}
              <div className="absolute -bottom-3 left-6 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-700" />
              <div className="absolute -bottom-3 right-6 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-700" />
              {/* Decal indicator */}
              {cosmetics.decals.length > 0 && (
                <div className="absolute top-4 left-8 text-[8px] text-white/50 uppercase tracking-wider">
                  {cosmetics.decals[0]}
                </div>
              )}
              {/* Body kit indicator */}
              {cosmetics.bodyKit && (
                <div className="absolute -bottom-4 left-0 right-0 h-2"
                  style={{ backgroundColor: cosmetics.paint || '#ffff00', opacity: 0.6 }}
                />
              )}
            </div>

            {/* License plate */}
            {cosmetics.plate && (
              <div className="mt-3 mx-auto w-24 h-5 bg-white rounded-sm flex items-center justify-center text-[8px] text-black font-bold uppercase tracking-wider">
                {cosmetics.plate}
              </div>
            )}

            {/* Car name */}
            <div className="mt-3 text-center">
              <span className="text-xs text-neon-cyan font-bold">{car.name}</span>
              <span className="text-xs text-gray-500 ml-2">Class {car.class}</span>
            </div>
          </div>

          {/* Paint */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Paint</h3>
            <div className="grid grid-cols-8 gap-1.5">
              {PAINT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateCosmetics({ paint: color })}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: cosmetics.paint === color ? '#ffffff' : 'transparent',
                    boxShadow: cosmetics.paint === color ? '0 0 8px currentColor' : undefined,
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Neon underglow */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Neon Underglow</h3>
            <div className="flex gap-2">
              {NEON_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateCosmetics({ neonColor: value })}
                  className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                    cosmetics.neonColor === value
                      ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                      : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Decals */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Decals</h3>
            <div className="flex gap-2">
              {DECAL_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateCosmetics({ decals: value ? [value] : [] })}
                  className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                    (value && cosmetics.decals.includes(value)) || (!value && cosmetics.decals.length === 0)
                      ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                      : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body kit */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Body Kit</h3>
            <div className="flex gap-2">
              {BODY_KITS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateCosmetics({ bodyKit: value })}
                  className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                    cosmetics.bodyKit === value
                      ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                      : 'border-neon-cyan/20 text-gray-500 hover:border-neon-cyan/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* License plate */}
          <div className="bg-midnight border border-neon-cyan/20 rounded p-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">License Plate</h3>
            <input
              type="text"
              maxLength={8}
              placeholder="Enter plate..."
              value={cosmetics.plate}
              onChange={(e) => updateCosmetics({ plate: e.target.value.toUpperCase() })}
              className="w-full bg-asphalt border border-neon-cyan/30 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-neon-pink uppercase"
            />
          </div>
        </>
      )}
    </div>
  );
}
