import React, { useState, useEffect } from 'react';
import { HistoryManager } from '../logic/HistoryManager';
import './HistoryView.css';

const HistoryView = ({ onBack }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        setHistory(HistoryManager.getHistory());
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear all history?')) {
            HistoryManager.clearHistory();
            loadHistory();
        }
    };

    const handleDelete = (id) => {
        if (confirm('Delete this match?')) {
            HistoryManager.deleteMatch(id);
            loadHistory();
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tennis_history.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="history-container">
            <div className="history-header">
                <button className="back-btn" onClick={onBack}>Back</button>
                <h2>Match History</h2>
                <div className="action-buttons">
                    <button className="clear-btn" onClick={handleExport} disabled={history.length === 0} style={{ marginRight: '10px', backgroundColor: '#4CAF50' }}>
                        Export JSON
                    </button>
                    <button className="clear-btn" onClick={handleClear} disabled={history.length === 0}>
                        Clear All
                    </button>
                </div>
            </div>

            <div className="history-list">
                {history.length === 0 ? (
                    <div className="no-history">No matches saved.</div>
                ) : (
                    history.map((match) => (
                        <div key={match.id} className="history-item">
                            <div className="history-date">{formatDate(match.date)}</div>
                            <div className="history-teams">
                                <div className="team-result">
                                    <span className="team-name">{match.team1Names.join(" & ")}</span>
                                    <span className="team-sets">Sets: {match.team1Sets}</span>
                                </div>
                                <div className="vs">vs</div>
                                <div className="team-result">
                                    <span className="team-name">{match.team2Names.join(" & ")}</span>
                                    <span className="team-sets">Sets: {match.team2Sets}</span>
                                </div>
                            </div>
                            <div className="history-details">
                                <div>Total Games: {match.setsHistory.reduce((acc, set) => acc + set.team1, 0) + match.team1Games} - {match.setsHistory.reduce((acc, set) => acc + set.team2, 0) + match.team2Games}</div>
                                <button className="delete-btn" onClick={() => handleDelete(match.id)}>Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryView;
