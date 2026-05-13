import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { loadGame } from './state/persistence';
import { CityMap } from './components/screens/CityMap';
import { Garage } from './components/screens/Garage';
import { CarMarket } from './components/screens/CarMarket';
import { CrewRoster } from './components/screens/CrewRoster';
import { Junkyard } from './components/screens/Junkyard';
import { MessageBoard } from './components/screens/MessageBoard';
import { Settings } from './components/screens/Settings';
import { RaceSetup } from './components/screens/RaceSetup';
import { RaceLive } from './components/screens/RaceLive';
import { Prestige } from './components/screens/Prestige';
import { Navigation } from './components/layout/Navigation';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const loadGameState = useGameStore((s) => s.loadGame);
  const crtEnabled = useGameStore((s) => s.game.settings.crtScanlines);

  useEffect(() => {
    const saved = loadGame();
    if (saved) loadGameState(saved);
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
