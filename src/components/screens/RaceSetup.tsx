import { useState } from 'react';
import { useGameStore } from '../../state/store';
import type { RaceSetup, DistrictId, Stakes, Posture, RaceLength } from '../../types/game';
import { usePlayerDrivers, usePlayerCars, useDistricts } from '../../hooks/useGame';

export function RaceSetup() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const drivers = usePlayerDrivers();
  const cars = usePlayerCars();
  const districts = useDistricts();

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('industrial');
  const [selectedDriver, setSelectedDriver] = useState(drivers[0]?.id ?? '');
  const [selectedCar, setSelectedCar] = useState(cars[0]?.id ?? '');
  const [stakes, setStakes] = useState<Stakes>('low');
  const [posture, setPosture] = useState<Posture>('safe');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (!selectedDriver || !selectedCar) return;

    const lengthMap: Record<Stakes, RaceLength> = {
      low: '5m', mid: '30m', high: '4h', boss: '8h',
    };

    const race: RaceSetup = {
      id: `race-${Date.now()}`,
      districtId: selectedDistrict,
      stakes,
      posture,
      length: lengthMap[stakes],
      playerCarIds: [selectedCar],
      playerDriverIds: [selectedDriver],
      rivalCarIds: [],
      rivalDriverIds: [],
      startTime: Date.now(),
      endTime: Date.now() + (stakes === 'low' ? 5 * 60000 : stakes === 'mid' ? 30 * 60000 : stakes === 'high' ? 4 * 3600000 : 8 * 3600000),
      seed: Math.floor(Math.random() * 1000000),
    };

    updateGame({ activeRaces: [...game.activeRaces, race] });
    setStarted(true);
    setTimeout(() => {
      setScreen('race-live');
      setStarted(false);
    }, 600);
  };

  if (drivers.length === 0 || cars.length === 0) {
    return (
      <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
        <p className="text-gray-500 text-sm">You need a driver and a car to race.</p>
        <p className="text-gray-600 text-xs mt-2">Recruit drivers at the Junkyard and buy cars at the Market.</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => setScreen('junkyard')}
            className="px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80"
          >
            Visit Junkyard
          </button>
          <button
            onClick={() => setScreen('car-market')}
            className="px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80"
          >
            Browse Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Set Up Race</h1>

      {/* District selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">District</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {Object.entries(districts).map(([id, d]) => (
            <button
              key={id}
              onClick={() => setSelectedDistrict(id as DistrictId)}
              className={`text-left p-2 rounded border text-sm transition-colors ${
                selectedDistrict === id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight hover:border-neon-cyan/50'
              }`}
            >
              <div className="text-neon-cyan">{d.name}</div>
              <div className="text-[10px] text-gray-500">{d.roadType}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Driver selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Driver</label>
        <div className="grid gap-2 mt-1">
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDriver(d.id)}
              className={`text-left p-2 rounded border text-sm ${
                selectedDriver === d.id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight'
              }`}
            >
              {d.name} ({d.personality})
            </button>
          ))}
        </div>
      </div>

      {/* Car selection */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Car</label>
        <div className="grid gap-2 mt-1">
          {cars.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCar(c.id)}
              className={`text-left p-2 rounded border text-sm ${
                selectedCar === c.id
                  ? 'border-neon-pink bg-neon-pink/10'
                  : 'border-neon-cyan/20 bg-midnight'
              }`}
            >
              {c.name} — Class {c.class}
            </button>
          ))}
        </div>
      </div>

      {/* Stakes */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Stakes</label>
        <div className="flex gap-2 mt-1">
          {(['low', 'mid', 'high', 'boss'] as Stakes[]).map((s) => (
            <button
              key={s}
              onClick={() => setStakes(s)}
              className={`flex-1 py-1.5 rounded border text-xs uppercase ${
                stakes === s
                  ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                  : 'border-neon-cyan/20 text-gray-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posture */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider">Posture</label>
        <div className="flex gap-2 mt-1">
          {(['safe', 'push', 'reckless'] as Posture[]).map((p) => (
            <button
              key={p}
              onClick={() => setPosture(p)}
              className={`flex-1 py-1.5 rounded border text-xs uppercase ${
                posture === p
                  ? 'border-neon-pink bg-neon-pink/10 text-neon-pink'
                  : 'border-neon-cyan/20 text-gray-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!selectedDriver || !selectedCar || started}
        className={`w-full py-3 font-bold rounded transition-all ${
          started
            ? 'bg-green-600 text-white'
            : 'bg-neon-pink text-black hover:bg-neon-pink/80 disabled:opacity-30 disabled:cursor-not-allowed'
        }`}
      >
        {started ? 'Race Started! →' : 'Start Race'}
      </button>
    </div>
  );
}
