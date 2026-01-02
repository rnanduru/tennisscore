const HISTORY_KEY = 'tennis_match_history';
const MAX_HISTORY = 100;

export const HistoryManager = {
    saveMatch: (matchData) => {
        try {
            const history = HistoryManager.getHistory();
            const newEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                ...matchData
            };

            // Add new entry to the beginning
            history.unshift(newEntry);

            // Enforce max limit
            if (history.length > MAX_HISTORY) {
                history.splice(MAX_HISTORY);
            }

            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error("Failed to save match history:", e);
            return false;
        }
    },

    getHistory: () => {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Failed to parse match history:", e);
            return [];
        }
    },

    clearHistory: () => {
        try {
            localStorage.removeItem(HISTORY_KEY);
            return true;
        } catch (e) {
            console.error("Failed to clear history:", e);
            return false;
        }
    },

    deleteMatch: (id) => {
        try {
            let history = HistoryManager.getHistory();
            history = history.filter(m => m.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error("Failed to delete match:", e);
            return false;
        }
    }
};
