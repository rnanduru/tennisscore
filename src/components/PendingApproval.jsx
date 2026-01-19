import React from 'react';
import './Login.css'; // Reuse login styles

const PendingApproval = ({ user, onLogout }) => {
    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Approval Pending</h2>
                <div style={{ fontSize: '3rem', margin: '20px 0' }}>⏳</div>
                <p>Hi <strong>{user.firstName}</strong>,</p>
                <p>Your account is waiting for administrator approval.</p>
                <p>Please check back later.</p>

                <button className="login-btn google-btn" onClick={onLogout} style={{ marginTop: '20px', justifyContent: 'center' }}>
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;
