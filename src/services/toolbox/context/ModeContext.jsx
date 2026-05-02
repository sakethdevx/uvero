import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { updateUserSettings, getUserSettings } from '../../../auth/authService';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    const { user } = useAuth();
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Load settings from DB on mount/login
    useEffect(() => {
        if (!user) return;
        
        async function loadSettings() {
            try {
                const { data } = await getUserSettings(user.id);
                if (data?.settings?.theme) {
                    setTheme(data.settings.theme);
                }
            } catch (err) {
                console.warn('Failed to load user settings:', err);
            }
        }
        loadSettings();
    }, [user]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Sync to DB if logged in
        if (user) {
            updateUserSettings(user.id, { theme }).catch(err => {
                console.warn('Failed to sync theme to DB:', err);
            });
        }
    }, [theme, user]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ModeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = () => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};
