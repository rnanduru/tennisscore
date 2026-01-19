import React from 'react';
import './MyReservations.css';
import { COURTS } from '../data/courts';

const MyReservations = ({ isOpen, onClose, reservations, currentUser, onCancel }) => {
    if (!isOpen) return null;

    // Filter reservations for the current user
    const myReservations = reservations.filter(r =>
        r.user === (currentUser ? currentUser.name : "You")
    );

    // Sort by date and time
    myReservations.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        // Simple string comparison for time works for 24h or consistent AM/PM if format is consistent
        // Our format is "H:MM AM/PM" or "HH:MM AM/PM". 
        // Let's rely on the order in the array or simpler logic for now. 
        // Ideally convert to minutes for sorting.
        return 0;
    });

    const getCourtName = (id) => {
        const court = COURTS.find(c => c.id === Number(id));
        return court ? court.name : 'Court';
    };

    const formatDate = (isoDate) => {
        const d = new Date(isoDate);
        // Adjust for timezone offset to avoid previous day issue if treating ISO as UTC vs Local
        // Since we store "YYYY-MM-DD", just parse parts to be safe
        const parts = isoDate.split('-');
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="my-reservations-overlay" onClick={onClose}>
            <div className="my-reservations-modal" onClick={e => e.stopPropagation()}>
                <div className="my-reservations-header">
                    <h2>My Bookings</h2>
                    <button className="close-modal-btn" onClick={onClose}>×</button>
                </div>

                <div className="reservations-list">
                    {myReservations.length === 0 ? (
                        <div className="no-reservations">
                            No active reservations found.
                        </div>
                    ) : (
                        myReservations.map((res, index) => (
                            <div key={`${res.date}-${res.startTime}-${res.courtId}`} className="reservation-card">
                                <div className="reservation-info">
                                    <span className="res-date">{formatDate(res.date)}</span>
                                    <span className="res-time">{res.startTime} - {res.endTime}</span>
                                    <span className="res-court">{getCourtName(res.courtId)}</span>
                                </div>
                                <button
                                    className="cancel-res-btn"
                                    onClick={() => {
                                        if (confirm("Cancel this reservation?")) {
                                            onCancel(res);
                                        }
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyReservations;
