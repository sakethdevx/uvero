/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    // Default to offline mode (privacy-first), check localStorage
    const [isOnlineMode, setIsOnlineMode] = useState(() => {
        const saved = localStorage.getItem('processingMode');
        return saved === 'online' ? true : false;
    });

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('processingMode', isOnlineMode ? 'online' : 'offline');
    }, [isOnlineMode]);

    const toggleMode = () => {
        setIsOnlineMode(prev => !prev);
    };

    return (
        <ModeContext.Provider value={{ isOnlineMode, toggleMode }}>
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
