import { useEffect, useRef } from 'react';
import { useGameStore } from './state/store';
import { loadGame, saveGame } from './state/persistence';
import { processIdleCatchup } from './engine/idle';
import { CityMap } from './components/screens/CityMap';
import { Garage } from './components/screens/Garage';
import { CarMarket } from './components/screens/CarMarket';
import { CrewRoster } from './components/screens/CrewRoster';
import { Junkyard } from './components/screens/Junkyard';
import { Customization } from './components/screens/Customization';
import { PartsShop } from './components/screens/PartsShop';
import { MessageBoard } from './components/screens/MessageBoard';
import { Settings } from './components/screens/Settings';
import { RaceSetup } from './components/screens/RaceSetup';
import { RaceLive } from './components/screens/RaceLive';
import { Prestige } from './components/screens/Prestige';
import { PathSelect } from './components/screens/PathSelect';
import { Navigation } from './components/layout/Navigation';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const game = useGameStore((s) => s.game);
  const loadGameState = useGameStore((s) => s.loadGame);
  const crtEnabled = game.settings.crtScanlines;
  const gameRef = useRef(game);
  gameRef.current = game;

  // Load save + process idle catchup on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      // Process idle catchup — rivals evolve, events fire, earnings accumulate
      const now = Date.now();
      const { updatedState } = processIdleCatchup(saved, now);
      loadGameState(updatedState);
      saveGame(updatedState);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(gameRef.current);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save on tab close / refresh
  useEffect(() => {
    const handleUnload = () => {
      saveGame(gameRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'city-map':
        return <CityMap />;
      case 'garage':
        return <Garage />;
      case 'car-market':
        return <CarMarket />;
      case 'crew-roster':
        return <CrewRoster />;
      case 'junkyard':
        return <Junkyard />;
      case 'customization':
        return <Customization />;
      case 'parts-shop':
        return <PartsShop />;
      case 'message-board':
        return <MessageBoard />;
      case 'settings':
        return <Settings />;
      case 'race-setup':
        return <RaceSetup />;
      case 'race-live':
        return <RaceLive />;
      case 'prestige':
        return <Prestige />;
      case 'path-select':
        return <PathSelect />;
      case 'more':
        return null;
      default:
        return <CityMap />;
    }
  };

  return (
    <div className={`min-h-dvh bg-asphalt text-gray-200 font-mono ${crtEnabled ? 'crt-scanlines' : ''}`}>
      <Navigation currentScreen={currentScreen} onNavigate={setScreen} />
      <main className="pb-20 px-2 pt-2 max-w-2xl mx-auto">
        {renderScreen()}
      </main>
    </div>
  );
}
