import { useState } from 'react';
import type { ScreenId } from './types/game';
import { CityMap } from './components/screens/CityMap';
import { Garage } from './components/screens/Garage';
import { CrewRoster } from './components/screens/CrewRoster';
import { MessageBoard } from './components/screens/MessageBoard';
import { Settings } from './components/screens/Settings';
import { Navigation } from './components/layout/Navigation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('city-map');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'city-map':
        return <CityMap />;
      case 'garage':
        return <Garage />;
      case 'crew-roster':
        return <CrewRoster />;
      case 'message-board':
        return <MessageBoard />;
      case 'settings':
        return <Settings />;
      default:
        return <CityMap />;
    }
  };

  return (
    <div className="min-h-dvh bg-asphalt text-gray-200 font-mono">
      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      <main className="pb-20 px-2 pt-2 max-w-2xl mx-auto">
        {renderScreen()}
      </main>
    </div>
  );
}
