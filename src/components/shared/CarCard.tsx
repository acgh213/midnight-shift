import type { Car } from '../../types/game';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
}

export function CarCard({ car, onClick }: CarCardProps) {
  const conditionColor = car.condition > 70 ? 'bg-green-500' : car.condition > 30 ? 'bg-neon-amber' : 'bg-red-500';

  return (
    <div
      onClick={onClick}
      className="bg-midnight border border-neon-cyan/20 rounded p-3 cursor-pointer hover:border-neon-pink/50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-bold text-neon-cyan">{car.name}</div>
          <div className="text-xs text-gray-500">{car.archetype} · Class {car.class}</div>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded border border-neon-cyan/30 text-neon-cyan">
          {car.class}
        </span>
      </div>
      {/* Condition bar */}
      <div className="mt-2 h-1.5 bg-pavement rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${conditionColor}`}
          style={{ width: `${car.condition}%` }}
        />
      </div>
      {car.assignedDriverId && (
        <div className="mt-1 text-xs text-gray-500">Driver assigned</div>
      )}
    </div>
  );
}
