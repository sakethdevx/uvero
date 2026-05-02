import { useSession } from '../lib/SessionContext';

/**
 * HistorySheet — Displays recent actions as compact glass cards.
 * Accessible via BottomNav → History or as a modal sheet.
 */
export default function HistorySheet({ isOpen, onClose, onRerun }) {
  const { history, clearHistory, removeHistoryItem, toggleFavorite, isFavorite } = useSession();

  if (!isOpen) return null;

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-start md:justify-center md:pt-[10vh] px-0 md:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Sheet */}
      <div className="relative w-full md:max-w-md animate-sheet-in md:animate-scale-in glass-panel md:rounded-2xl rounded-t-2xl rounded-b-none max-h-[85vh] flex flex-col overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border-glass)' }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">History</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              {history.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs font-medium hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                Clear all
              </button>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-2)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                No actions yet
              </p>
              <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                Your recent actions will appear here
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id}
                className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                style={{ border: '1px solid var(--border-glass)' }}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.action}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {item.inputSummary || item.description}
                    {' · '}
                    {formatTime(item.timestamp)}
                  </p>
                </div>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Favorite */}
                  <button
                    onClick={() => item.capability && toggleFavorite({
                      id: item.capability,
                      label: item.action,
                      icon: item.icon,
                      description: item.description,
                    })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    title={isFavorite(item.capability) ? 'Unpin' : 'Pin to favorites'}
                  >
                    <svg className="w-3.5 h-3.5" fill={isFavorite(item.capability) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: isFavorite(item.capability) ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>

                  {/* Rerun */}
                  <button
                    onClick={() => { onRerun?.(item); onClose?.(); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    title="Run again"
                  >
                    <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeHistoryItem(item.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
