import { usePlayerCars } from '../../hooks/useGame';
import { CarCard } from '../shared/CarCard';

export function Garage() {
  const cars = usePlayerCars();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl text-neon-cyan tracking-wide">Garage</h1>
      {cars.length === 0 ? (
        <div className="bg-midnight border border-neon-cyan/20 rounded p-6 text-center">
          <p className="text-gray-500 text-sm">No cars in your garage yet.</p>
          <p className="text-gray-600 text-xs mt-2">Win races to earn cash and build your fleet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
