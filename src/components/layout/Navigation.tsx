import type { ScreenId } from '../../types/game';

interface NavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const NAV_ITEMS: { screen: ScreenId; label: string }[] = [
  { screen: 'city-map', label: 'City' },
  { screen: 'garage', label: 'Garage' },
  { screen: 'crew-roster', label: 'Crew' },
  { screen: 'message-board', label: 'Board' },
  { screen: 'settings', label: '⚙' },
];

export function Navigation({ currentScreen, onNavigate }: NavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-midnight border-t border-neon-cyan/20 z-50">
      <div className="flex justify-around max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ screen, label }) => (
          <button
            key={screen}
            onClick={() => onNavigate(screen)}
            className={`
              flex-1 py-3 text-xs uppercase tracking-wider transition-colors
              ${currentScreen === screen
                ? 'text-neon-cyan border-t-2 border-neon-cyan'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
