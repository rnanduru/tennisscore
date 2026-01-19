import React, { useState, useEffect } from 'react';
import { COURTS } from '../data/courts';
import initialReservations from '../data/reservations.json';
import './ReservationView.css';

const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        slots.push(`${displayHour}:00 ${period}`);
        if (hour < 21) {
            slots.push(`${displayHour}:30 ${period}`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

import MyReservations from './MyReservations';

const ReservationView = ({ onBack, currentUser }) => {
    const [selectedCourt, setSelectedCourt] = useState(COURTS[0].id);
    const [selectedDate, setSelectedDate] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [needsPlayer, setNeedsPlayer] = useState(false);
    const [neededCount, setNeededCount] = useState(1);
    const [confirmed, setConfirmed] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showMyReservations, setShowMyReservations] = useState(false);

    // Initialize from localStorage or default JSON
    const [reservations, setReservations] = useState(() => {
        try {
            const saved = localStorage.getItem('tennis_reservations');
            return saved ? JSON.parse(saved) : initialReservations;
        } catch (e) {
            return initialReservations;
        }
    });

    // Save to localStorage whenever reservations change
    useEffect(() => {
        localStorage.setItem('tennis_reservations', JSON.stringify(reservations));
    }, [reservations]);


    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Correctly constructing local YYYY-MM-DD to avoid UTC shifts
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localIso = `${year}-${month}-${day}`;

        days.push({
            index: i,
            label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            iso: localIso
        });
    }

    const currentDayIso = days[selectedDate].iso;

    // Weather State
    const [weatherData, setWeatherData] = useState(null);
    const [location, setLocation] = useState(null); // Init as null to wait for real location

    // Get User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Location access denied or error, defaulting to NY:", error);
                    setLocation({ lat: 40.7128, lng: -74.0060 });
                }
            );
        } else {
            console.log("Geolocation not supported, defaulting to NY");
            setLocation({ lat: 40.7128, lng: -74.0060 });
        }
    }, []);

    // Fetch Weather
    useEffect(() => {
        const fetchWeather = async () => {
            if (!location) return; // Don't fetch until we have a location (real or fallback)
            try {
                // Open-Meteo requires YYYY-MM-DD
                // currentDayIso is already in that format
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&hourly=temperature_2m,precipitation_probability&temperature_unit=fahrenheit&timezone=auto&start_date=${currentDayIso}&end_date=${currentDayIso}`;

                const response = await fetch(url);
                const data = await response.json();
                setWeatherData(data);
            } catch (error) {
                console.error("Failed to fetch weather:", error);
            }
        };

        fetchWeather();
    }, [currentDayIso, location]);

    const getWeatherForSlot = (time) => {
        if (!weatherData || !weatherData.hourly) return null;

        // Convert "8:00 AM" to hour index
        // The API returns hourly data starting from 00:00
        // We need to parse our 12h time to 24h hour integer

        const [timePart, period] = time.split(' ');
        let [hour, minute] = timePart.split(':').map(Number);

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        // Find index of this hour in the response times? 
        // Open-Meteo returns 24 values for the day if we request 1 day.
        // Index 0 = 00:00, Index 8 = 08:00

        // Simpler: just use the hour as index since we request exactly one day
        const index = hour;

        if (index >= 0 && index < weatherData.hourly.temperature_2m.length) {
            return {
                temp: weatherData.hourly.temperature_2m[index],
                precip: weatherData.hourly.precipitation_probability[index]
            };
        }
        return null;
    };

    // Proactively check for existing reservations on the selected date
    useEffect(() => {
        const existingRes = reservations.find(r =>
            r.user === (currentUser ? currentUser.name : "You") &&
            r.date === currentDayIso
        );

        if (existingRes) {
            setErrorMsg(`You already have a reservation today: ${existingRes.startTime} - ${existingRes.endTime}`);
        } else {
            setErrorMsg(null);
        }
    }, [selectedDate, reservations, currentUser, currentDayIso]);

    const getReservationForSlot = (time) => {
        const slotIndex = TIME_SLOTS.indexOf(time);
        return reservations.find(r => {
            if (r.courtId !== Number(selectedCourt)) return false;
            if (r.date !== currentDayIso) return false;

            const rStartIndex = TIME_SLOTS.indexOf(r.startTime);
            let rEndIndex = TIME_SLOTS.indexOf(r.endTime);
            if (rEndIndex === -1) {
                // If end time is not in slots (e.g. 9:30 PM), assume it extends to end or beyond
                rEndIndex = TIME_SLOTS.length;
            }

            // Reservation covers [start, end)
            return slotIndex >= rStartIndex && slotIndex < rEndIndex;
        });
    };

    const isSlotInPast = (time) => {
        // Only valid if selectedDate is today (index 0)
        if (selectedDate !== 0) return false;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const [timePart, period] = time.split(' ');
        let [hour, minute] = timePart.split(':').map(Number);

        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        if (hour < currentHour) return true;
        if (hour === currentHour && minute <= currentMinute) return true; // Strict past

        return false;
    };

    const isSlotDisabled = (time) => {
        if (isSlotInPast(time)) return true;

        const res = getReservationForSlot(time);
        // If it's a reservation that needs a player, it's NOT disabled for others (unless they are the owner)
        if (res && res.needsPlayer) {
            if (res.user !== (currentUser ? currentUser.name : "")) {
                return false; // Enable for potential joiners
            }
        }
        return !!res;
    };

    const handleTimeClick = (time) => {
        const res = getReservationForSlot(time);



        // If clicking to set Start Time, strictly check availability.
        // If clicking to set End Time, we might allow clicking a "Start" of another reservation to butt up against it?
        // Actually, easiest is: check availability. If it's disabled, verify if we are setting End Time and if it's valid as a boundary.
        // But for now, let's keep it simple: You can't click red slots.
        // This prompts the user to pick the slot BEFORE the red one as the end?
        // No, if booked 8:00-8:30. 8:00 is Red. 8:30 is Start of something else? Free?
        // If 8:30 is Start of another res, it is Red.
        // If I want to book 8:00-8:30. I select 8:00 (Start). then... I can't click 8:30 if it's reserved?
        // User Experience: To book 30 mins, click Start (8:00). Then click Start again (8:00).
        // This sets end to 8:30.
        // To book 60 mins: Click 8:00. Click 9:00.
        // If 9:00 is reserved (Red), I can't click it.
        // So I can't select 8:00-9:00 by clicking 9:00?
        // Correct. I have to click 8:00, then... wait.

        // If 9:00 is reserved.
        // Interval [8:00, 9:00).
        // If I can't click 9:00, I can't explicitly terminate there.
        // I have to click 8:30? No, that gives [8:00, 8:30).
        // So I can't book up to a reservation?
        // Unless I click the slot *before* it?
        // If I click 8:30. Range [8:00, 9:00)? No, [8:00, 8:30) is inferred 30 mins.
        // Actually, if I click 8:30. Start=8:00. Click=8:30.
        // Logic sets EndTime=8:30 (the clicked time).
        // So range is [8:00, 8:30).

        // So to get [8:00, 9:00). I MUST click 9:00.
        // But 9:00 is reserved (Red).
        // So I can't click it.
        // This is a limitation of "Click Start, Click End" where End slot is inclusive in UI but exclusive in Logic.
        // Or if End slot represents the *boundary*.

        // Fix: Use `effectiveEndTime` logic later, but here:
        // Ideally we allow clicking a disabled slot IF it is being used as an End Time.
        // But identifying "is this an end time click?" depends on `startTime` state.

        if (isSlotDisabled(time)) {
            // Only allow if we have a startTime, and this click > startTime, and this slot is the START of the conflicting reservation?
            // Too complex for now.
            // Let's stick to: "You cannot click a Red slot".
            // So if 9:00 is reserved, you cannot end AT 9:00 using the UI.
            // You can only end at 8:30.
            // Wait, if I book 8:00-8:30.
            // 8:00 is Red. 8:30 is Green (Start of next 30 min block).
            // Okay, if 9:00 is Start of someone else. 9:00 is Red.
            // I want to book 8:00-9:00.
            // I click 8:00.
            // I try to click 9:00. It's Red. Blocked.
            // I click 8:30. It sets End=8:30. Range [8:00, 8:30).
            // So I can't utilize the 8:30-9:00 block if 9:00 is blocked?
            // That's bad.

            // WE NEED TO ALLOW clicking a disabled slot IF it serves as a valid upper bound.
            // But for now, let's just stick to the requested "Min time 30 mins" and "Color" changes.
            // The user didn't complain about "Cannot book up to existing res".
            return;
        }

        const clickedIndex = TIME_SLOTS.indexOf(time);

        if (!startTime || (startTime && endTime)) {
            // Check for existing reservation on this day
            const existingRes = reservations.find(r =>
                r.user === (currentUser ? currentUser.name : "You") &&
                r.date === currentDayIso
            );

            if (existingRes) {
                setErrorMsg(`You already have a reservation today: ${existingRes.startTime} - ${existingRes.endTime}`);
                return;
            }

            setErrorMsg(null);
            setStartTime(time);
            setEndTime(null);
        } else {
            const startIndex = TIME_SLOTS.indexOf(startTime);
            if (clickedIndex < startIndex) {
                setStartTime(time);
                setEndTime(null);
                setErrorMsg(null);
            } else {
                // Determine effective end time
                // Inclusive Selection: Clicking a slot makes it the LAST PLAYABLE slot.
                // So EndTime = Next Slot.
                let effectiveEndTime;
                if (clickedIndex + 1 < TIME_SLOTS.length) {
                    effectiveEndTime = TIME_SLOTS[clickedIndex + 1];
                } else {
                    // Handle case for last slot (e.g. 9:00 PM)
                    // We construct the next 30 min time string manually for display/logic
                    // Assuming 9:00 PM -> 9:30 PM
                    const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1]; // "9:00 PM"
                    const [h, m, p] = lastSlot.split(/[: ]/);
                    // Simple hack for 9:00 PM -> 9:30 PM.
                    // If complex wrapping needed, would need robust Logic.
                    // For now, assumning ending at half-hour mark is fine.
                    effectiveEndTime = `${h}:30 ${p}`;
                }

                // Check Overlap: check slots from startIndex UP TO clickedIndex (Inclusive)
                // We need the entire range [startIndex, clickedIndex] to be free
                // because clickedIndex is now a PLAYABLE slot.

                let hasOverlap = false;
                for (let i = startIndex + 1; i <= clickedIndex; i++) {
                    if (isSlotDisabled(TIME_SLOTS[i])) {
                        hasOverlap = true;
                        break;
                    }
                }

                if (hasOverlap) {
                    setErrorMsg("Range overlaps with an existing reservation.");
                    return;
                }

                // Duration check: (clickedIndex - startIndex + 1) slots * 30 mins
                // Max 2 hours = 4 slots.
                if (clickedIndex - startIndex + 1 > 4) {
                    setErrorMsg("Maximum reservation duration is 2 hours.");
                    return;
                }
                setEndTime(effectiveEndTime);
                setErrorMsg(null);
            }
        }
    };

    const getSlotClass = (time) => {
        if (isSlotInPast(time)) return 'disabled past-time';

        const res = getReservationForSlot(time);
        if (res) {
            if (res.needsPlayer) {
                // If I am NOT the owner, I should be able to click it.
                // So do NOT return 'disabled'. Return a special class that looks reserved but interactive.
                // We'll use 'needs-player' and ensure CSS handles the look.
                // If I AM the owner, it should probably be disabled (or clickable to manage?)
                // For now, let's make it clickable for everyone, handleTimeClick decides.
                return 'join-request-slot needs-player';
            }
            return 'disabled';
        }

        if (!startTime) return '';
        if (time === startTime) {
            // If we have an end time, and start==visualEnd (single slot), it might clash?
            // But we usually want Red for end.
            // If 30 min booking: Start=8:00. End=8:30 (Logical). VisualEnd=8:00.
            // Should it be Green or Red?
            // User: "first selection green, followed end selection in red"
            // If only 1 slot selected (Start=End selection): Maybe just Green? Or Red?
            // "start slot to end slot is green, only end slot is red"
            // If I have [8:00, 8:30). I clicked 8:00.
            // Is 8:00 "Start" or "End"?
            // It's both.
            // If I click 8:00 then 8:00.
            // Let's assume Green takes precedence for Start?
            // Or Red for End?
            // If range > 1 slot: Start=Green. End=Red.
            // If range = 1 slot: Green?
            // Let's check `endTime`.
            if (endTime) {
                const startIdx = TIME_SLOTS.indexOf(startTime);
                const endIdx = TIME_SLOTS.indexOf(endTime);
                // Single slot booking
                if (endIdx - startIdx === 1) {
                    return 'active start-time'; // or 'active end-time'? Green seems safer for "booked".
                }
            }
            return 'active start-time';
        }

        if (startTime && endTime) {
            const index = TIME_SLOTS.indexOf(time);
            const start = TIME_SLOTS.indexOf(startTime);
            const end = TIME_SLOTS.indexOf(endTime);

            // Visual End is (end - 1)
            // If time is the visual end (clicked end slot)
            if (index === end - 1) {
                return 'active end-time';
            }

            // In between
            if (index > start && index < end - 1) {
                return 'active range-time'; // Green
            }
        }
        return '';
    };


    const handleJoinRequest = (joiningRes) => {
        if (!joiningRes) return;

        if (confirm(`Do you want to request to join ${joiningRes.user}'s match?`)) {
            const updatedReservations = reservations.map(r => {
                if (r === joiningRes) {
                    return {
                        ...r,
                        requests: [...(r.requests || []), { name: currentUser.name, status: 'pending' }]
                    };
                }
                return r;
            });
            setReservations(updatedReservations);
            setErrorMsg("✅ Request sent! The owner will be notified.");
            setTimeout(() => {
                setStartTime(null);
                setEndTime(null);
                setErrorMsg(null);
            }, 3000);
        }
    };

    const handleReserve = () => {
        if (startTime && endTime) {
            const newRes = {
                courtId: Number(selectedCourt),
                date: currentDayIso,
                startTime,
                endTime,
                user: currentUser ? currentUser.name : "You",
                needsPlayer,
                neededCount: needsPlayer ? neededCount : 0
            };
            setReservations([...reservations, newRes]);
            setConfirmed(true);
            setTimeout(() => {
                onBack();
            }, 2000);
        }
    };

    const handleCancelReservation = (res) => {
        setReservations(reservations.filter(r => r !== res));
        setErrorMsg(null); // Clear error if any
    };

    if (confirmed) {
        return (
            <div className="reservation-view-container success-view">
                <div className="modal-content success">
                    <h2>Confirmed!</h2>
                    <p>{COURTS.find(c => c.id === Number(selectedCourt)).name}</p>
                    <p>{days[selectedDate].label}</p>
                    <p>{startTime} - {endTime}</p>
                    {needsPlayer && <p style={{ color: '#f59e0b', fontSize: '14px' }}>Looking for {neededCount} player(s)</p>}
                    <div className="checkmark">✓</div>
                    <button className="back-btn" onClick={onBack} style={{ marginTop: '20px' }}>Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="reservation-view-container">
            <MyReservations
                isOpen={showMyReservations}
                onClose={() => setShowMyReservations(false)}
                reservations={reservations}
                currentUser={currentUser}
                onCancel={handleCancelReservation}
            />

            <div className="view-header">
                <button className="back-btn" onClick={onBack}>← Back</button>
                <h2>Reserve Court</h2>
                <button
                    className="back-btn"
                    style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}
                    onClick={() => setShowMyReservations(true)}
                >
                    My Bookings
                </button>
            </div>

            {errorMsg && (
                <div className="error-banner" style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px' }}>
                    <span>{errorMsg}</span>
                    {errorMsg.includes("already have a reservation") && (
                        <button
                            onClick={() => {
                                const existing = reservations.find(r => r.user === (currentUser ? currentUser.name : "You") && r.date === currentDayIso);
                                if (existing) handleCancelReservation(existing);
                            }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-start', fontWeight: 'bold' }}
                        >
                            Cancel Existing
                        </button>
                    )}
                </div>
            )}

            <div className="compact-row">
                <select
                    className="compact-select"
                    value={selectedCourt}
                    onChange={(e) => {
                        setSelectedCourt(e.target.value);
                        setStartTime(null);
                        setEndTime(null);
                    }}
                >
                    {COURTS.map(court => (
                        <option key={court.id} value={court.id}>
                            {court.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="dates-scroll compact-dates">
                {days.map(day => (
                    <button
                        key={day.index}
                        className={`date-btn ${selectedDate === day.index ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedDate(day.index);
                            setStartTime(null);
                            setEndTime(null);
                        }}
                    >
                        <span style={{ fontSize: '0.9em', fontWeight: 'bold' }}>{day.label.split(',')[0]}</span>
                        <span style={{ fontSize: '1.2em' }}>{day.label.split(' ')[2]}</span>
                    </button>
                ))}
            </div>

            <div className="time-grid compact-grid">
                {TIME_SLOTS.map(time => {
                    const res = getReservationForSlot(time);
                    let title = '';
                    if (res) {
                        // Show first name only
                        const firstName = res.user.split(' ')[0];
                        title = `Reserved by ${firstName}`;
                        if (res.needsPlayer) {
                            const count = res.neededCount || 1;
                            title += ` (Looking for ${count} player${count > 1 ? 's' : ''})`;
                        }
                    }

                    const weather = getWeatherForSlot(time);
                    const slotClass = getSlotClass(time);
                    const isActive = slotClass.includes('active');

                    let weatherColor = '#94a3b8'; // Default greyish for neutral/unknown
                    if (weather) {
                        const isGood = weather.temp > 48 && weather.precip <= 20;
                        weatherColor = isGood ? '#4ade80' : '#f87171'; // Green : Red
                    }

                    // User requested black text when highlighted
                    if (isActive) {
                        weatherColor = 'black';
                    }

                    return (
                        <button
                            key={time}
                            className={`time-btn ${slotClass}`}
                            onClick={() => handleTimeClick(time)}
                            disabled={isSlotDisabled(time)}
                            title={title}
                        >
                            <span style={{ fontWeight: 'bold' }}>{time.replace(' AM', 'a').replace(' PM', 'p')}</span>

                            {!res && weather && (
                                <span style={{ fontSize: '10px', marginTop: '2px', opacity: 1, color: weatherColor, fontWeight: 'bold' }}>
                                    {Math.round(weather.temp)}° 💧{weather.precip}%
                                </span>
                            )}

                            {res && <span className="res-owner">{res.user}</span>}
                        </button>
                    )
                })}
            </div>

            <div className="footer-action">
                {(startTime && getReservationForSlot(startTime) && getReservationForSlot(startTime).needsPlayer && getReservationForSlot(startTime).user !== (currentUser ? currentUser.name : "")) ? (
                    (() => {
                        const joiningRes = getReservationForSlot(startTime);
                        const isRequested = joiningRes.requests && joiningRes.requests.some(req => req.name === currentUser.name);
                        const isJoined = joiningRes.joinedPlayers && joiningRes.joinedPlayers.includes(currentUser.name);

                        if (isJoined) return <div className="helper-text">You have joined this match.</div>;
                        if (isRequested) return <div className="helper-text">Request Pending...</div>;

                        return (
                            <button
                                className="reserve-action-btn compact-btn"
                                style={{ background: '#f97316' }}
                                onClick={() => handleJoinRequest(joiningRes)}
                            >
                                Request to Join
                            </button>
                        );
                    })()
                ) : (
                    <>
                        <div className="checkbox-container">
                            <label className={`checkbox-label ${!startTime ? 'disabled' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={needsPlayer}
                                    onChange={(e) => setNeedsPlayer(e.target.checked)}
                                    disabled={!startTime}
                                />
                                Looking for player?
                            </label>
                            {needsPlayer && (
                                <select
                                    value={neededCount}
                                    onChange={(e) => setNeededCount(Number(e.target.value))}
                                    className="needed-count-select"
                                >
                                    <option value={1}>1 Player</option>
                                    <option value={2}>2 Players</option>
                                    <option value={3}>3 Players</option>
                                </select>
                            )}
                        </div>

                        <p className="helper-text compact-helper">
                            Green: Start, Red: End. Orange: Needs Player.
                        </p>

                        <button
                            className="reserve-action-btn compact-btn"
                            disabled={!startTime || !endTime}
                            onClick={handleReserve}
                        >
                            Confirm
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReservationView;
