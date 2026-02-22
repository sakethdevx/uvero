/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    // Default to offline mode (privacy-first), check localStorage
    const [isOnlineMode, setIsOnlineMode] = useState(() => {
        const saved = localStorage.getItem('processingMode');
        return saved === 'online' ? true : false;
    });

    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Save preferences to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('processingMode', isOnlineMode ? 'online' : 'offline');
    }, [isOnlineMode]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleMode = () => {
        setIsOnlineMode(prev => !prev);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ModeContext.Provider value={{ isOnlineMode, toggleMode, theme, toggleTheme, setTheme }}>
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
