import React, { useEffect, useState } from 'react';
import './Scoreboard.css';

const Scoreboard = ({ matchManager, onEnd }) => {
    const [matchState, setMatchState] = useState(matchManager);

    // Subscribe to updates from MatchManager
    useEffect(() => {
        matchManager.setUpdateCallback((updatedManager) => {
            setMatchState({ ...updatedManager });
        });
    }, [matchManager]);

    const team1Name = matchManager.getTeam1Name();
    const team2Name = matchManager.getTeam2Name();

    const renderSets = (team) => {
        const sets = matchManager.setsHistory;

        // Determine how many columns to show. We show at least 1, max(currentSetIndex + 1)
        const currentSetIndex = sets.length;

        const setCells = [];
        // Render history
        for (let i = 0; i < currentSetIndex; i++) {
            const score = team === 1 ? sets[i].team1 : sets[i].team2;
            setCells.push(
                <div key={i} className="score-cell set-score">
                    {score}
                </div>
            );
        }

        // Render current set
        if (!matchManager.winner) {
            const score = team === 1 ? matchManager.team1Games : matchManager.team2Games;
            setCells.push(
                <div key={currentSetIndex} className="score-cell set-score current-set">
                    {score}
                </div>
            );
        }

        return setCells;
    };

    const isTeam1SetPoint = matchManager.isSetPoint(1);
    const isTeam2SetPoint = matchManager.isSetPoint(2);

    return (
        <div className="scoreboard-container">
            <div className="header">
                <button className="back-btn" onClick={onEnd}>Back</button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>Match in Progress</span>
                    <span style={{ fontSize: 12, color: '#888' }}>Dynamic Sets</span>
                </div>
                <div style={{ width: 60 }}></div>
            </div>

            <div className="scoreboard-grid">
                {/* Header Row */}
                <div className="grid-row header-row">
                    <div className="name-col">Player/Team</div>
                    <div className="sets-col">Sets</div>
                    <div className="point-col">Points</div>
                </div>

                {/* Team 1 Row */}
                <div className={`grid-row team-row`}>
                    <div className="name-col">
                        {team1Name}
                        {isTeam1SetPoint && <span className="indicator set-point">SP</span>}
                    </div>
                    <div className="sets-col">
                        {renderSets(1)}
                    </div>
                    <div className="point-col point-display">
                        <button className="score-btn btn-minus" onClick={() => matchManager.removePoint(1)}>-</button>
                        <span>{matchManager.displayScore(matchManager.team1Points)}</span>
                        <button className="score-btn btn-plus" onClick={() => matchManager.addPoint(1)}>+</button>
                    </div>
                </div>

                {/* Team 2 Row */}
                <div className={`grid-row team-row`}>
                    <div className="name-col">
                        {team2Name}
                        {isTeam2SetPoint && <span className="indicator set-point">SP</span>}
                    </div>
                    <div className="sets-col">
                        {renderSets(2)}
                    </div>
                    <div className="point-col point-display">
                        <button className="score-btn btn-minus" onClick={() => matchManager.removePoint(2)}>-</button>
                        <span>{matchManager.displayScore(matchManager.team2Points)}</span>
                        <button className="score-btn btn-plus" onClick={() => matchManager.addPoint(2)}>+</button>
                    </div>
                </div>
            </div>

            {matchManager.winner && (
                <div className="winner-banner">
                    {matchManager.winner.join(" & ")} Wins!
                </div>
            )}

            {!matchManager.winner && (
                <p className="instruction">Use + and - to update score</p>
            )}
        </div>
    );
};

export default Scoreboard;
