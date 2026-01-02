import { useState } from 'react'
import Setup from './components/Setup'
import Scoreboard from './components/Scoreboard'
import HistoryView from './components/HistoryView'
import { MatchManager } from './logic/MatchManager'
import './App.css'

const VIEW = {
  SETUP: 'setup',
  SCOREBOARD: 'scoreboard',
  HISTORY: 'history'
};

function App() {
  const [currentView, setCurrentView] = useState(VIEW.SETUP);
  const [matchManager, setMatchManager] = useState(null);

  const handleStart = (team1Names, team2Names) => {
    const manager = new MatchManager(team1Names, team2Names);
    setMatchManager(manager);
    setCurrentView(VIEW.SCOREBOARD);
  };

  const handleEnd = () => {
    if (matchManager) {
      // Save statistics before exiting
      import('./logic/HistoryManager').then(({ HistoryManager }) => {
        HistoryManager.saveMatch(matchManager.toJSON());
      });
    }
    setMatchManager(null);
    setCurrentView(VIEW.SETUP);
  };

  const renderView = () => {
    switch (currentView) {
      case VIEW.SETUP:
        return <Setup
          onStart={handleStart}
          onViewHistory={() => setCurrentView(VIEW.HISTORY)}
        />;
      case VIEW.SCOREBOARD:
        return <Scoreboard
          matchManager={matchManager}
          onEnd={handleEnd}
        />;
      case VIEW.HISTORY:
        return (
          // Dynamic import for HistoryView would be cleaner but let's stick to standard import at top
          // Note: Need to add import at top
          <HistoryView onBack={() => setCurrentView(VIEW.SETUP)} />
        );
      default:
        return <Setup onStart={handleStart} />;
    }
  };

  return (
    <div className="app-container">
      {renderView()}
    </div>
  )
}

export default App
