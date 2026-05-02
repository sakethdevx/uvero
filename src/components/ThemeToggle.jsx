import { useMode } from '../services/toolbox/context/ModeContext';

const ThemeToggle = () => {
  const { theme, effectiveTheme, toggleTheme } = useMode();

  const sunIconClasses = `w-5 h-5 absolute transition-all duration-500 transform ${theme === 'light' ? 'translate-y-0 opacity-100 rotate-0' : (theme === 'dark' ? '-translate-y-8 opacity-0 -rotate-90' : 'translate-y-8 opacity-0 rotate-90')
    }`;

  const moonIconClasses = `w-5 h-5 absolute transition-all duration-500 transform ${theme === 'dark' ? 'translate-y-0 opacity-100 rotate-0' : (theme === 'system' ? '-translate-y-8 opacity-0 -rotate-90' : 'translate-y-8 opacity-0 rotate-90')
    }`;

  const systemIconClasses = `w-5 h-5 absolute transition-all duration-500 transform ${theme === 'system' ? 'translate-y-0 opacity-100 rotate-0' : (theme === 'light' ? '-translate-y-8 opacity-0 -rotate-90' : 'translate-y-8 opacity-0 rotate-90')
    }`;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center relative group"
      aria-label={`Switch theme (currently ${theme})`}
      title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun icon */}
        <svg className={sunIconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>

        {/* Moon icon */}
        <svg className={moonIconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>

        {/* System / Monitor icon */}
        <svg className={systemIconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
    </button>
  );
};

export default ThemeToggle;
