import { useState, useRef } from 'react';
import type { ScreenId } from '../../types/game';

interface NavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

interface NavItem {
  screen: ScreenId;
  icon: string;
  label: string;
}

const PRIMARY: NavItem[] = [
  { screen: 'city-map', icon: '🏙', label: 'City' },
  { screen: 'garage', icon: '🏠', label: 'Garage' },
  { screen: 'crew-roster', icon: '👥', label: 'Crew' },
  { screen: 'race-setup', icon: '🏁', label: 'Race' },
  { screen: 'more', icon: '⋯', label: 'More' },
];

const SECONDARY: NavItem[] = [
  { screen: 'car-market', icon: '🏪', label: 'Car Market' },
  { screen: 'customization', icon: '🎨', label: 'Customization' },
  { screen: 'parts-shop', icon: '🔧', label: 'Parts Shop' },
  { screen: 'junkyard', icon: '🪦', label: 'Junkyard' },
  { screen: 'race-live', icon: '📡', label: 'Race Live' },
  { screen: 'message-board', icon: '📋', label: 'Message Board' },
  { screen: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
  { screen: 'path-select', icon: '🛣', label: 'Your Path' },
  { screen: 'settings', icon: '⚙', label: 'Settings' },
];

const isActivePrimary = (screen: ScreenId, current: ScreenId): boolean => {
  if (screen === current) return true;
  if (screen === 'garage' && ['car-market', 'customization', 'parts-shop'].includes(current)) return true;
  if (screen === 'crew-roster' && current === 'junkyard') return true;
  if (screen === 'race-setup' && current === 'race-live') return true;
  if (screen === 'more' && SECONDARY.some((s) => s.screen === current)) return true;
  return false;
};

const isActiveSecondary = (screen: ScreenId, current: ScreenId): boolean => {
  return screen === current || (screen === 'more' && SECONDARY.some((s) => s.screen === current));
};

export function Navigation({ currentScreen, onNavigate }: NavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const prevScreenRef = useRef<ScreenId>('city-map');

  // Don't track 'more' as previous
  if (currentScreen !== 'more') {
    prevScreenRef.current = currentScreen;
  }

  const handlePrimary = (item: NavItem) => {
    if (item.screen === 'more') {
      setMoreOpen(!moreOpen);
      if (!moreOpen) onNavigate('more');
    } else {
      setMoreOpen(false);
      onNavigate(item.screen);
    }
  };

  const handleSecondary = (screen: ScreenId) => {
    setMoreOpen(false);
    onNavigate(screen);
  };

  const closeMore = () => {
    setMoreOpen(false);
    onNavigate(prevScreenRef.current);
  };

  return (
    <>
      {/* Primary nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-midnight border-t border-neon-cyan/20 z-50">
        <div className="flex justify-around max-w-lg mx-auto">
          {PRIMARY.map(({ screen, icon, label }) => {
            const active = isActivePrimary(screen, currentScreen);
            return (
              <button
                key={screen}
                onClick={() => handlePrimary({ screen, icon, label })}
                className={`flex-1 flex flex-col items-center py-2 transition-colors relative ${
                  active
                    ? 'text-neon-cyan'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[9px] uppercase tracking-wider mt-0.5">{label}</span>
                {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-neon-cyan rounded-b" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* "More" slide-up sheet */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMore}
          />
          {/* Sheet */}
          <div className="fixed bottom-14 left-0 right-0 bg-midnight border-t border-neon-cyan/20 rounded-t-xl z-50 animate-slide-up max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mt-2 mb-3" />
            <div className="grid grid-cols-3 gap-2 px-3 pb-6">
              {SECONDARY.map(({ screen, icon, label }) => {
                const active = isActiveSecondary(screen, currentScreen);
                return (
                  <button
                    key={screen}
                    onClick={() => handleSecondary(screen)}
                    className={`flex flex-col items-center py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-neon-cyan/10 text-neon-cyan'
                        : 'text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-[9px] mt-1 text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
