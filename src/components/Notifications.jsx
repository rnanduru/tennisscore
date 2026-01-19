import React, { useState, useEffect } from 'react';
import './Notifications.css';

const Notifications = ({ onClose, currentUser }) => {
    // Determine initial state
    const [reservations, setReservations] = useState(() => {
        try {
            const saved = localStorage.getItem('tennis_reservations');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Save strictly to local storage on update
    useEffect(() => {
        localStorage.setItem('tennis_reservations', JSON.stringify(reservations));
    }, [reservations]);

    // Derived state: pending requests for current user's reservations
    const myPendingRequests = reservations.flatMap(res => {
        if (res.user !== currentUser.name) return [];
        if (!res.requests) return [];
        return res.requests
            .filter(req => req.status === 'pending')
            .map(req => ({ ...req, reservation: res }));
    });

    const handleApprove = (req) => {
        const updatedReservations = reservations.map(r => {
            if (r === req.reservation) {
                // Logic: 
                // 1. Decrement neededCount
                // 2. Add to joinedPlayers
                // 3. Remove request (or mark approved)
                // 4. If neededCount == 0, set needsPlayer = false

                const currentNeeded = Number(r.neededCount) || 0;
                const newNeeded = Math.max(0, currentNeeded - 1);
                const shouldNeedPlayer = newNeeded > 0;

                return {
                    ...r,
                    neededCount: newNeeded,
                    needsPlayer: shouldNeedPlayer,
                    joinedPlayers: [...(r.joinedPlayers || []), req.name],
                    requests: r.requests.filter(x => x.name !== req.name)
                };
            }
            return r;
        });
        setReservations(updatedReservations);
    };

    const handleDeny = (req) => {
        const updatedReservations = reservations.map(r => {
            if (r === req.reservation) {
                return {
                    ...r,
                    requests: r.requests.filter(x => x.name !== req.name)
                };
            }
            return r;
        });
        setReservations(updatedReservations);
    };

    return (
        <div className="notifications-overlay">
            <div className="notifications-content">
                <div className="notifications-header">
                    <h2>Requests</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="notification-list">
                    {myPendingRequests.length === 0 ? (
                        <div className="no-notifications">No pending requests</div>
                    ) : (
                        myPendingRequests.map((req, idx) => (
                            <div key={idx} className="notification-item">
                                <p><strong>{req.name.split(' ')[0]}</strong> wants to join your match.</p>
                                <p style={{ fontSize: '11px', color: '#888' }}>
                                    {req.reservation.date} @ {req.reservation.startTime}
                                </p>
                                <div className="notification-actions">
                                    <button className="approve-btn" onClick={() => handleApprove(req)}>Approve</button>
                                    <button className="deny-btn" onClick={() => handleDeny(req)}>Deny</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
