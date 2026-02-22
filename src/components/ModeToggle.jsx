import { useMode } from '../context/ModeContext';

const ModeToggle = () => {
    const { isOnlineMode, toggleMode } = useMode();

    return (
        <div className="flex items-center gap-3">
            <span className={`text-sm font-medium transition-colors ${!isOnlineMode ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                🔒 Offline
            </span>
            <button
                onClick={toggleMode}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isOnlineMode ? 'bg-blue-600' : 'bg-primary-600'
                    }`}
                role="switch"
                aria-checked={isOnlineMode}
                aria-label="Toggle between offline and online mode"
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOnlineMode ? 'translate-x-8' : 'translate-x-1'
                        }`}
                />
            </button>
            <span className={`text-sm font-medium transition-colors ${isOnlineMode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                ☁️ Online
            </span>
        </div>
    );
};

export default ModeToggle;
