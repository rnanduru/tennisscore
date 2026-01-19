import { useState, useEffect } from 'react'
import Setup from './components/Setup'
import Scoreboard from './components/Scoreboard'
import HistoryView from './components/HistoryView'
import TrackerView from './components/TrackerView'
import ReservationView from './components/ReservationView'
import Login from './components/Login'
import { MatchManager } from './logic/MatchManager'
import './App.css'

const VIEW = {
  SETUP: 'setup',
  SCOREBOARD: 'scoreboard',
  HISTORY: 'history',
  TRACKER: 'tracker',
  RESERVATION: 'reservation'
};

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

function App() {
  // Auth State
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tennis_user'));
    } catch (e) {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(VIEW.SETUP);
  const [matchManager, setMatchManager] = useState(null);

  useEffect(() => {
    // Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If we are already logged out explicitly (user is null), we might want to respect that?
      // Actually, Firebase's onAuthStateChanged is the source of truth.
      // If firebaseUser exists, it means we are logged in.
      // If we clicked logout, signOut() is called, which triggers this callback with null.
      if (firebaseUser) {
        const appUser = {
          name: firebaseUser.displayName,
          firstName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : 'User',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL
        };
        setUser(appUser);
      } else {
        // Firebase says we are signed out.
        // We do nothing here, let handleLogout clear the state to be safe, 
        // OR we can clear it here to ensure sync.
        // Let's clear it here to ensure if token expires or revoked, we log out.
        // However, we want to allow "Mock" users to persist.
        // Mock users don't trigger onAuthStateChanged.

        // So ONLY clear if the current user was a Firebase user (has email/uid etc)
        // But for simplicity in this hybrid mode:
        // We won't auto-clear here to protect Mock logins.
      }
    });
    return () => unsubscribe();
  }, []);

  // Persist User (Manual / Mock)
  useEffect(() => {
    if (user) {
      localStorage.setItem('tennis_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tennis_user');
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
    setUser(null);
    setCurrentView(VIEW.SETUP);
    localStorage.removeItem('tennis_user');
  };

  const handleStart = (team1Names, team2Names) => {
    const manager = new MatchManager(team1Names, team2Names);
    setMatchManager(manager);
    setCurrentView(VIEW.SCOREBOARD);
  };

  const handleEnd = () => {
    if (matchManager) {
      import('./logic/HistoryManager').then(({ HistoryManager }) => {
        HistoryManager.saveMatch(matchManager.toJSON());
      });
    }
    setMatchManager(null);
    setCurrentView(VIEW.SETUP);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case VIEW.SETUP:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Setup
              onStart={handleStart}
              onViewHistory={() => setCurrentView(VIEW.HISTORY)}
              onViewTracker={() => setCurrentView(VIEW.TRACKER)}
              user={user}
              onLogout={handleLogout}
            />
            <button className="reserve-btn-main" onClick={() => setCurrentView(VIEW.RESERVATION)}>
              Reserve Court
            </button>
          </div>
        );
      case VIEW.SCOREBOARD:
        return <Scoreboard
          matchManager={matchManager}
          onEnd={handleEnd}
        />;
      case VIEW.HISTORY:
        return (
          <HistoryView onBack={() => setCurrentView(VIEW.SETUP)} />
        );
      case VIEW.TRACKER:
        return <TrackerView onBack={() => setCurrentView(VIEW.SETUP)} />;
      case VIEW.RESERVATION:
        return (
          <ReservationView
            onBack={() => setCurrentView(VIEW.SETUP)}
            currentUser={user}
          />
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
