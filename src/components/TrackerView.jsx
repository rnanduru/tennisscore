import { useState, useRef } from 'react';
import './TrackerView.css';

const TrackerView = ({ onBack }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState("");
    const [liveFrame, setLiveFrame] = useState(null);

    const wsRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
            setProgress("");
            setLiveFrame(null);
        }
    };

    const handleStop = () => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        setLoading(false);
        setProgress("Analysis Stopped by User.");
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult({ shots: [], summary: "Initializing..." });
        setProgress("Uploading...");
        setLiveFrame(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const uploadResponse = await fetch('http://127.0.0.1:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed. Is the backend running?');
            }

            const { task_id } = await uploadResponse.json();

            // 2. Connect to WebSocket
            if (wsRef.current) wsRef.current.close(); // Cleanup

            const ws = new WebSocket(`ws://127.0.0.1:8000/ws/analyze/${task_id}`);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'progress') {
                    const percent = Math.round((message.frame / message.total) * 100);
                    setProgress(`Scanning video for shots... (${percent}%)`);
                } else if (message.type === 'shot') {
                    if (message.data.type === "Info") {
                        // System message
                        setResult(prev => ({ ...prev, summary: message.data.spin }));
                    } else {
                        setResult(prev => ({
                            ...prev,
                            shots: [...(prev.shots || []), message.data]
                        }));
                    }
                } else if (message.type === 'frame') {
                    setLiveFrame(message.image);
                } else if (message.type === 'complete') {
                    setResult(prev => ({
                        ...prev,
                        summary: message.summary
                    }));
                    setLoading(false);
                    ws.close();
                } else if (message.type === 'error') {
                    setError(message.message);
                    setLoading(false);
                    ws.close();
                }
            };

            ws.onerror = (e) => {
                console.error("WebSocket error", e);
                setError("WebSocket connection failed");
                setLoading(false);
            };

            ws.onclose = () => {
                console.log("WebSocket closed");
                // Ensure loading is false if closed unexpectedly
                setLoading(false);
            };

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error connecting to analysis server');
            setLoading(false);
        }
    };

    return (
        <div className="tracker-container">
            <div className="tracker-header">
                <h2>AI Shot Analyzer</h2>
                <p>Upload a video to analyze shot type, speed, and line calls.</p>
            </div>

            <div className="upload-section">
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="file-input"
                />

                {loading ? (
                    <button onClick={handleStop} className="analyze-btn stop-btn" style={{ backgroundColor: '#e74c3c' }}>
                        Stop Analysis
                    </button>
                ) : (
                    <button onClick={handleAnalyze} disabled={!file} className="analyze-btn">
                        Analyze Match
                    </button>
                )}

                {/* Live Feed Display */}
                {liveFrame && (
                    <div className="live-feed-container" style={{ margin: '20px 0', textAlign: 'center' }}>
                        <h4>Live Analysis Feed</h4>
                        <img src={liveFrame} alt="Live Feed" style={{ maxWidth: '100%', borderRadius: '8px', border: '2px solid #2ecc71' }} />
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>{progress}</div>
                    </div>
                )}

                {/* Progress Bar (Only show if no live frame yet) */}
                {loading && !liveFrame && <div className="progress-text">{progress}</div>}

                {error && <div className="error-msg" style={{ color: '#ef4444' }}>{error}</div>}
            </div>

            {result && (
                <div className="results-section">
                    <h3>Match Analysis</h3>
                    <p className="summary-text">{result.summary}</p>

                    <div className="shots-list">
                        {result.shots && result.shots.length > 0 ? (
                            result.shots.map((shot) => (
                                <div key={shot.id} className="result-card shot-card">
                                    <div className="shot-time">{shot.timestamp}</div>
                                    <div className="shot-details">
                                        <div className="shot-type">
                                            {shot.type} <span style={{ fontSize: '0.8em', opacity: 0.8 }}>({shot.spin})</span>
                                        </div>
                                        <div className="shot-speed">{shot.speed_mph} mph</div>
                                        {shot.clip_url && (
                                            <a href={shot.clip_url} target="_blank" rel="noopener noreferrer" className="clip-link">
                                                🎥 Watch
                                            </a>
                                        )}
                                    </div>
                                    <div className={`shot-in-out ${shot.is_in ? 'status-in' : 'status-out'}`}>
                                        {shot.is_in ? 'IN' : 'OUT'}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ opacity: 0.6, fontStyle: 'italic', textAlign: 'center' }}>No shots detected in this video.</div>
                        )}
                    </div>
                </div>
            )}

            <button onClick={onBack} className="back-btn">
                Back to Menu
            </button>
        </div>
    );
};

export default TrackerView;
