import { usePlayerCars } from '../../hooks/useGame';
import { useGameStore } from '../../state/store';
import { CarCard } from '../shared/CarCard';

export function Garage() {
  const cars = usePlayerCars();
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-neon-cyan tracking-wide">Garage</h1>
        <button
          onClick={() => setScreen('car-market')}
          className="text-xs px-3 py-1 rounded border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
        >
          Buy Cars
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No cars in your garage yet.</p>
          <p className="text-gray-600 text-xs mt-2">Win races to earn cash and build your fleet.</p>
          <button
            onClick={() => setScreen('car-market')}
            className="mt-4 px-4 py-2 bg-neon-pink text-black text-xs font-bold rounded hover:bg-neon-pink/80 transition-colors"
          >
            Browse Car Market
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {cars.map((car) => (
            <div key={car.id}>
              <CarCard car={car} />
              <button
                onClick={() => setScreen('customization')}
                className="mt-1 w-full py-1.5 text-xs text-neon-cyan border border-neon-cyan/20 rounded hover:bg-neon-cyan/10 transition-colors"
              >
                Customize
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
