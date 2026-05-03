import { useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav — Mobile-only bottom navigation.
 * Home | History | Command (center, prominent) | Favorites | Profile
 * md:hidden — desktop never sees this.
 */
export default function BottomNav({ onCommandPress, onHistoryPress, onFavoritesPress }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const items = [
    { id: 'home', label: 'Home', path: '/', icon: HomeIcon },
    { id: 'history', label: 'History', path: null, icon: HistoryIcon },
    { id: 'command', label: 'Command', path: null, icon: CommandIcon, isCenter: true },
    { id: 'favorites', label: 'Favorites', path: null, icon: FavoritesIcon },
    { id: 'profile', label: 'Profile', path: '/profile', icon: ProfileIcon },
  ];

  const handlePress = (item) => {
    if (item.id === 'command') {
      onCommandPress?.();
    } else if (item.id === 'history') {
      onHistoryPress?.();
    } else if (item.id === 'favorites') {
      onFavoritesPress?.();
    } else if (item.path) {
      navigate(item.path);
    }
  };


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-panel rounded-none"
      style={{
        borderTop: '1px solid var(--border-glass)',
        borderRadius: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const isActive = item.path && path === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => handlePress(item)}
                className="relative flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{
                    background: 'var(--accent)',
                    boxShadow: '0 4px 20px var(--accent-subtle)',
                  }}
                >
                  <Icon size={22} color="white" />
                </div>
                <span className="text-[9px] font-bold mt-1 uppercase tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handlePress(item)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors"
            >
              <Icon size={20} color={isActive ? 'var(--accent)' : 'var(--text-secondary)'} />
              <span className="text-[9px] font-semibold"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Inline SVG Icons ── */
function HomeIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function HistoryIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CommandIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.625 14.875 18.375l2.625.75L18.25 21.75l.75-2.625 2.625-.75-2.625-.75L18.25 15z" />
    </svg>
  );
}

function FavoritesIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ProfileIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
