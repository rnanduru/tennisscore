import React, { useState } from 'react';
import { PLAYER_COUNT } from '../logic/MatchManager';
import './Setup.css';

const Setup = ({ onStart, onViewHistory }) => {
    const [playerCount, setPlayerCount] = useState(PLAYER_COUNT.TWO);
    const [team1Names, setTeam1Names] = useState(['']);
    const [team2Names, setTeam2Names] = useState(['']);

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

        </div>
    );
};

export default Setup;
