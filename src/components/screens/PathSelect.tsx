import { useState } from 'react';
import { useGameStore } from '../../state/store';
import type { PlayerPath } from '../../types/game';
import { racerSignatureBonus } from '../../engine/paths';

interface PathOption {
  id: PlayerPath;
  title: string;
  subtitle: string;
  description: string;
  perks: string[];
  flavor: string;
}

const PATHS: PathOption[] = [
  {
    id: 'racer',
    title: 'The Racer',
    subtitle: 'One driver. One car. Respect earned on asphalt.',
    description: 'You drive. Your hands on the wheel, your reputation on the line. Solo events, personal rivalries, and the pure rush of the midnight run.',
    perks: [
      'Signature driver: designate one driver as "you" — +10 all stats',
      'Solo events: 1v1 challenges against crew leaders',
      'Personal XP: your driver gains stats faster',
      'Reputation multiplier: winning solo earns more rep',
    ],
    flavor: 'There\'s a moment, somewhere around 3am, when the road empties and the tach is bouncing off redline and you realize: nobody can touch you. Not the cops. Not the rivals. Not the voice in your head that said you couldn\'t.',
  },
  {
    id: 'boss',
    title: 'The Boss',
    subtitle: 'Build something bigger than yourself.',
    description: 'You manage. Recruit talent, assign cars, send crew on missions. The city is a chessboard and you\'re reading three moves ahead.',
    perks: [
      'Boss Vision: see rival heat levels and challenge timing on City Map',
      'Recruitment discount: −20% hiring cost at Junkyard',
      'Crew Orders: send idle drivers on solo missions for passive income',
      'Poach rival drivers: spend rep to lure away rival talent',
    ],
    flavor: 'They think the boss sits in an office. They don\'t see you at 2am with the city map spread across the hood of your car, marking territory in neon grease pencil. Every driver you recruited, every car you bought, every race you didn\'t run but still won — that\'s your signature.',
  },
];

export function PathSelect() {
  const game = useGameStore((s) => s.game);
  const updateGame = useGameStore((s) => s.updateGame);
  const setScreen = useGameStore((s) => s.setScreen);
  const [selected, setSelected] = useState<PlayerPath>(game.playerPath);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    const updates: Partial<typeof game> = { playerPath: selected };

    // Apply Racer stat bonus to the crew leader (first driver)
    if (selected === 'racer') {
      const playerDriverIds = game.crews.player.drivers;
      if (playerDriverIds.length > 0) {
        const leaderId = playerDriverIds[0];
        const leader = game.drivers[leaderId];
        if (leader) {
          const boostedStats = racerSignatureBonus(leader.stats);
          updates.drivers = {
            ...game.drivers,
            [leaderId]: {
              ...leader,
              stats: boostedStats,
              isSignature: true,
            },
          };
          updates.crews = {
            ...game.crews,
            player: {
              ...game.crews.player,
              leaderId,
            },
          };
        }
      }
    }

    updateGame(updates as any);
    setConfirmed(true);
    setTimeout(() => setScreen('city-map'), 1500);
  };

  if (confirmed) {
    return (
      <div className="text-center py-12">
        <p className="text-neon-cyan text-lg">
          {selected === 'racer' ? 'Take the wheel.' : 'Build the empire.'}
        </p>
        <p className="text-gray-500 text-xs mt-2">Redirecting to the city...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-neon-cyan tracking-wide">Choose Your Path</h1>
        <p className="text-xs text-gray-500 mt-1">
          This shapes how you play. Racer is about driving — personal skill, solo glory. 
          Boss is about managing — crew strategy, territory control. You can switch later 
          (costs one night), but the first choice sets your tone.
        </p>
      </div>

      <div className="grid gap-4">
        {PATHS.map((path) => {
          const isSelected = selected === path.id;
          const isCurrent = game.playerPath === path.id;

          return (
            <button
              key={path.id}
              onClick={() => setSelected(path.id)}
              className={`text-left p-4 rounded border transition-all ${
                isSelected
                  ? 'border-neon-pink bg-neon-pink/10 shadow-[0_0_15px_rgba(255,45,149,0.15)]'
                  : 'border-neon-cyan/20 bg-midnight hover:border-neon-cyan/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-lg font-bold ${isSelected ? 'text-neon-pink' : 'text-neon-cyan'}`}>
                    {path.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{path.subtitle}</p>
                </div>
                {isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                    CURRENT
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-400 mt-3 leading-relaxed">{path.description}</p>

              <div className="mt-3 space-y-1">
                {path.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-2">
                    <span className="text-neon-pink text-xs mt-0.5">▸</span>
                    <span className="text-xs text-gray-400">{perk}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600 italic mt-3 leading-relaxed border-l-2 border-gray-700 pl-3">
                {path.flavor}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-3 bg-neon-pink text-black font-bold rounded hover:bg-neon-pink/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {selected === game.playerPath ? 'Continue as ' + (selected === 'racer' ? 'Racer' : 'Boss') : 'Switch to ' + (selected === 'racer' ? 'Racer' : 'Boss')}
      </button>
    </div>
  );
}
