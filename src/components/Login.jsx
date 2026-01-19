import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './Login.css';

const Login = ({ onLogin }) => {
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        // Real Firebase Login
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            // Map Firebase user to our app's user structure
            const appUser = {
                name: user.displayName,
                firstName: user.displayName ? user.displayName.split(' ')[0] : 'User',
                email: user.email,
                photo: user.photoURL
            };
            onLogin(appUser);
        } catch (err) {
            console.log("Full Firebase Error Object:", err);
            console.error("Firebase Login Error Code:", err.code);
            console.error("Firebase Login Error Message:", err.message);

            // Handle specific error codes if needed
            if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key') {
                setError(`Firebase Config Error: ${err.message}`);
            } else if (err.code === 'auth/api-key-not-valid') {
                setError("Invalid API Key in src/firebase.js.");
            } else {
                setError(`Login failed: ${err.message}`);
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Tennis Scoreboard</h1>
                <p>Sign in to manage matches and reservations</p>

                {error && <div className="error-msg">{error}</div>}

                <div className="login-options">
                    <button className="google-btn main-login" onClick={handleGoogleLogin}>
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google logo"
                        />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
