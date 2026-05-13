import type { Driver } from '../../types/game';

interface DriverCardProps {
  driver: Driver;
  onClick?: () => void;
}

const STAT_LABELS: Record<string, string> = {
  speed: 'SPD',
  control: 'CTL',
  aggression: 'AGG',
  reputation: 'REP',
};

export function DriverCard({ driver, onClick }: DriverCardProps) {
  const loyaltyColor = driver.loyalty > 50 ? 'bg-green-500' : driver.loyalty > 25 ? 'bg-neon-amber' : 'bg-red-500';
  const poachRisk = driver.loyalty < 25;

  return (
    <div
      onClick={onClick}
      className="bg-midnight border border-neon-cyan/20 rounded p-3 cursor-pointer hover:border-neon-pink/50 transition-colors relative"
    >
      {poachRisk && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded">
          POACH RISK
        </div>
      )}
      <div className="flex justify-between">
        <div>
          <div className="text-sm font-bold text-neon-pink">{driver.name}</div>
          {driver.nickname && <div className="text-xs text-gray-400">"{driver.nickname}"</div>}
          <div className="text-xs text-gray-500 mt-1">{driver.personality}</div>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            {Object.entries(STAT_LABELS).map(([key, label]) => (
              <div key={key}>
                <span className="text-gray-600">{label}</span>{' '}
                <span className="text-gray-300">{driver.stats[key as keyof typeof driver.stats]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Loyalty bar */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-gray-600 w-12">LOYALTY</span>
        <div className="flex-1 h-1.5 bg-pavement rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${loyaltyColor}`}
            style={{ width: `${driver.loyalty}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-600 w-6">{driver.loyalty}</span>
      </div>
    </div>
  );
}
