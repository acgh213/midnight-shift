import { useEffect, useRef } from 'react';
import { useGameStore } from './state/store';
import { loadGame, saveGame } from './state/persistence';
import { serverSave, serverLoad } from './state/serverPersistence';
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
import { Leaderboard } from './components/screens/Leaderboard';
import { PathSelect } from './components/screens/PathSelect';
import { Navigation } from './components/layout/Navigation';
import { useSSE } from './hooks/useSSE';

const CREW_NAME = 'Midnight Crew';
const SAVE_ID = 'default';

export default function App() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const game = useGameStore((s) => s.game);
  const loadGameState = useGameStore((s) => s.loadGame);
  const crtEnabled = game.settings.crtScanlines;
  const gameRef = useRef(game);
  gameRef.current = game;

  // Live SSE connection for leaderboard + events
  useSSE();

  // Load save + process idle catchup on mount
  useEffect(() => {
    const load = async () => {
      // Try server first, fall back to localStorage
      let saved = await serverLoad(SAVE_ID);
      if (!saved) {
        saved = loadGame();
      }
      if (saved) {
        const now = Date.now();
        const { updatedState } = processIdleCatchup(saved, now);
        loadGameState(updatedState);
        saveGame(updatedState);
        // Sync back to server
        serverSave(updatedState, SAVE_ID, CREW_NAME);
      }
    };
    load();
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const state = gameRef.current;
      saveGame(state);
      serverSave(state, SAVE_ID, CREW_NAME);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save on tab close / refresh
  useEffect(() => {
    const handleUnload = () => {
      const state = gameRef.current;
      saveGame(state);
      // Fire-and-forget server save
      navigator.sendBeacon?.('/api/save?id=' + SAVE_ID + '&crew=' + encodeURIComponent(CREW_NAME), JSON.stringify(state));
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
      case 'leaderboard':
        return <Leaderboard />;
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
