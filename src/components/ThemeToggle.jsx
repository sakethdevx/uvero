import { useMode } from '../context/ModeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useMode();

    return (
        <button
            onClick={toggleTheme}
            className="group relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                {/* Sun icon for dark mode (to switch to light) */}
                <svg
                    className={`w-5 h-5 absolute transition-all duration-500 transform ${theme === 'dark' ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-8 opacity-0 rotate-90'
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                    />
                </svg>

                {/* Moon icon for light mode (to switch to dark) */}
                <svg
                    className={`w-5 h-5 absolute transition-all duration-500 transform ${theme === 'light' ? 'translate-y-0 opacity-100 rotate-0' : '-translate-y-8 opacity-0 -rotate-90'
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            </div>

            {/* Tooltip */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
        </button>
    );
};

export default ThemeToggle;
