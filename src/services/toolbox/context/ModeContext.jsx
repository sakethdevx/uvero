import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { updateUserSettings, getUserSettings } from '../../../auth/authService';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    const { user } = useAuth();
    
    // theme can be 'light', 'dark', or 'system'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'system';
    });

    // Determine the actual theme to apply to the document
    const [effectiveTheme, setEffectiveTheme] = useState(() => {
        if (theme !== 'system') return theme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Update effective theme when theme or system preference changes
    useEffect(() => {
        if (theme !== 'system') {
            setEffectiveTheme(theme);
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
        };

        handleChange();
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Load settings from DB on mount/login
    useEffect(() => {
        if (!user) return;
        
        async function loadSettings() {
            try {
                const { data } = await getUserSettings(user.id);
                // If data.theme is null, it stays 'system'
                if (data?.theme) {
                    setTheme(data.theme);
                } else if (data) {
                    setTheme('system');
                }
            } catch (err) {
                console.warn('Failed to load user settings:', err);
            }
        }
        loadSettings();
    }, [user]);

    // Apply theme and sync to DB/LocalStorage
    useEffect(() => {
        localStorage.setItem('theme', theme);
        
        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Update meta theme-color to match the surface color
        const themeColor = effectiveTheme === 'dark' ? '#09090f' : '#f7f8fc';
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', themeColor);

        // Sync to DB if logged in
        if (user) {
            // Save null for 'system' to match DB design
            const dbTheme = theme === 'system' ? null : theme;
            updateUserSettings(user.id, { theme: dbTheme }).catch(err => {
                console.warn('Failed to sync theme to DB:', err);
            });
        }
    }, [theme, effectiveTheme, user]);

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'system') return 'light';
            if (prev === 'light') return 'dark';
            return 'system';
        });
    };

    return (
        <ModeContext.Provider value={{ theme, effectiveTheme, toggleTheme, setTheme }}>
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
