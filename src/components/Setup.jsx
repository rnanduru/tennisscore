import React, { useState, useEffect } from 'react';
import { PLAYER_COUNT } from '../logic/MatchManager';
import './Setup.css';
import Notifications from './Notifications';

const Setup = ({ onStart, onViewHistory, onViewTracker, user, onLogout }) => {
    const [playerCount, setPlayerCount] = useState(PLAYER_COUNT.TWO);
    const [team1Names, setTeam1Names] = useState(['']);
    const [team2Names, setTeam2Names] = useState(['']);
    const [showNotifications, setShowNotifications] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Check for notifications periodically or on mount
    useEffect(() => {
        const checkNotifications = () => {
            try {
                const saved = localStorage.getItem('tennis_reservations');
                const reservations = saved ? JSON.parse(saved) : [];

                let count = 0;
                reservations.forEach(res => {
                    if (res.user === user.name && res.requests) {
                        count += res.requests.filter(r => r.status === 'pending').length;
                    }
                });
                setPendingCount(count);
            } catch (e) {
                setPendingCount(0);
            }
        };

        checkNotifications();
        // Poll every 2 seconds to act as "live" updates for demo purposes
        const interval = setInterval(checkNotifications, 2000);
        return () => clearInterval(interval);
    }, [user]);


    const handlePlayerCountChange = (count) => {
        setPlayerCount(count);
        if (count === PLAYER_COUNT.TWO) {
            setTeam1Names(['']);
            setTeam2Names(['']);
        } else {
            setTeam1Names(['', '']);
            setTeam2Names(['', '']);
        }
    };

    const handleNameChange = (team, index, value) => {
        if (team === 1) {
            const newNames = [...team1Names];
            newNames[index] = value;
            setTeam1Names(newNames);
        } else {
            const newNames = [...team2Names];
            newNames[index] = value;
            setTeam2Names(newNames);
        }
    };

    const isValid = () => {
        return [...team1Names, ...team2Names].every(name => name.trim() !== '');
    };

    return (
        <div className="setup-container">
            <div className="profile-header">
                {user && (
                    <div className="user-info">
                        <div className="notification-icon" onClick={() => setShowNotifications(true)}>
                            🔔
                            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
                        </div>
                        <img src={user.photo} alt="Profile" className="user-photo" />
                        <span>{user.firstName || user.name.split(' ')[0]}</span>
                        <button className="logout-btn" onClick={onLogout} title="Switch Account">Switch Account</button>
                    </div>
                )}
            </div>

            {showNotifications && (
                <Notifications onClose={() => setShowNotifications(false)} currentUser={user} />
            )}

            <h1>New Match</h1>

            <div className="form-section">
                <label>Players</label>
                <div className="segment">
                    <button
                        className={playerCount === PLAYER_COUNT.TWO ? 'active' : ''}
                        onClick={() => handlePlayerCountChange(PLAYER_COUNT.TWO)}
                    >
                        2 Players
                    </button>
                    <button
                        className={playerCount === PLAYER_COUNT.FOUR ? 'active' : ''}
                        onClick={() => handlePlayerCountChange(PLAYER_COUNT.FOUR)}
                    >
                        4 Players
                    </button>
                </div>
            </div>

            <div className="form-section">
                <h2>Team 1</h2>
                {team1Names.map((name, i) => (
                    <input
                        key={i}
                        placeholder={`Player ${i + 1} Name`}
                        value={name}
                        onChange={(e) => handleNameChange(1, i, e.target.value)}
                    />
                ))}
            </div>

            <div className="form-section">
                <h2>Team 2</h2>
                {team2Names.map((name, i) => (
                    <input
                        key={i}
                        placeholder={`Player ${i + 1} Name`}
                        value={name}
                        onChange={(e) => handleNameChange(2, i, e.target.value)}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="start-btn" disabled={!isValid()} onClick={() => onStart(team1Names, team2Names)}>
                    Start Match
                </button>
                <button className="start-btn history-btn" style={{ backgroundColor: '#555' }} onClick={onViewHistory}>
                    History
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="start-btn" style={{ backgroundColor: '#2563eb', width: '100%' }} onClick={onViewTracker}>
                    🎾 AI Video Tracker
                </button>
            </div>

        </div>
    );
};

export default Setup;
