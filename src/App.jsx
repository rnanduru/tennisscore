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
import { doc, getDoc, setDoc, collection, query, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import PendingApproval from './components/PendingApproval';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user document exists in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          let userData;

          if (userSnap.exists()) {
            userData = userSnap.data();
          } else {
            // First time login for this user
            // Check if this is the FIRST user ever (Global Admin)
            const q = query(collection(db, 'users'), limit(1));
            const querySnapshot = await getDocs(q);
            const isFirstUser = querySnapshot.empty;

            userData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Unknown',
              email: firebaseUser.email,
              photo: firebaseUser.photoURL,
              role: isFirstUser ? 'admin' : 'user',
              status: isFirstUser ? 'approved' : 'pending',
              createdAt: new Date().toISOString()
            };

            await setDoc(userRef, userData);
          }

          const appUser = {
            ...userData,
            firstName: userData.name ? userData.name.split(' ')[0] : 'User',
          };
          setUser(appUser);

        } catch (error) {
          console.error("Error fetching/creating user:", error);
          // Fallback for visual continuity if firestore fails?
          // For now, let's just log it.
        }
      } else {
        // Logged out
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
    if (user && user.status === 'pending') {
      return <PendingApproval user={user} onLogout={handleLogout} />;
    }

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
