import { useMemo } from 'react';
import { useSession } from '../lib/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HistorySheet — Displays recent actions as compact glass cards.
 * Groups by Today / Yesterday / Older.
 * Shows readable action summaries ("Convert PNG → JPG").
 */
export default function HistorySheet({ isOpen, onClose, onRerun }) {
  const { history, clearHistory, removeHistoryItem, toggleFavorite, isFavorite } = useSession();

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

  // Build a readable summary from action + description
  const getSummary = (item) => {
    if (item.description && item.description.includes('→')) return item.description;
    if (item.inputSummary) return `${item.action} · ${item.inputSummary.slice(0, 30)}`;
    return item.action;
  };

  // Group entries: today / yesterday / older
  const groupedHistory = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    const today = [];
    const yesterday = [];
    const older = [];

    for (const item of history) {
      if (item.timestamp >= todayStart) today.push(item);
      else if (item.timestamp >= yesterdayStart) yesterday.push(item);
      else older.push(item);
    }

    const groups = [];
    if (today.length) groups.push({ label: 'Today', items: today });
    if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
    if (older.length) groups.push({ label: 'Older', items: older });
    return groups;
  }, [history]);

  // Example prompts for the empty state
  const emptyExamples = [
    { icon: '📄', label: 'Convert a PDF to images' },
    { icon: '🔳', label: 'Generate a QR code' },
    { icon: '📋', label: 'Share a snippet' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-start md:justify-center md:pt-[10vh] px-0 md:px-4 native-feel">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" 
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="relative w-full md:max-w-md glass-panel md:rounded-2xl rounded-t-3xl rounded-b-none max-h-[85vh] flex flex-col overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Grab handle for mobile */}
            <div className="w-full flex justify-center py-2 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
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
                  <button onClick={clearHistory} className="text-xs font-medium hover:underline p-2 -my-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Clear history
                  </button>
                )}
                <button onClick={onClose}
                  className="w-11 h-11 -mr-2 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {history.length === 0 ? (
            /* ── Empty state with example prompts ── */
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-2)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Nothing yet</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Your actions will appear here after you use Uvero.
                </p>
              </div>
              <div className="w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-center mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Try one of these
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {emptyExamples.map((ex) => (
                    <button
                      key={ex.label}
                      onClick={() => { onClose?.(); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:-translate-y-px"
                      style={{
                        background: 'var(--surface-2)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-glass)',
                      }}
                    >
                      <span>{ex.icon}</span>
                      <span>{ex.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Grouped history ── */
            groupedHistory.map((group) => (
              <div key={group.label}>
                {/* Group label */}
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {group.label}
                </p>

                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item.id}
                      className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      style={{ border: '1px solid var(--border-glass)' }}
                    >
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {getSummary(item)}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {formatTime(item.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Try again — always visible as compact pill */}
                        <button
                          onClick={() => { onRerun?.(item); onClose?.(); }}
                          className="hidden group-hover:flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                          }}
                          title="Try again"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try again
                        </button>

                        {/* Favorite */}
                        <button
                          onClick={() => item.capability && toggleFavorite({
                            id: item.capability,
                            label: item.action,
                            icon: item.icon,
                            description: item.description,
                          })}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                          title={isFavorite(item.capability) ? 'Unpin' : 'Pin'}
                        >
                          <svg className="w-3.5 h-3.5" fill={isFavorite(item.capability) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"
                            style={{ color: isFavorite(item.capability) ? 'var(--accent)' : 'var(--text-secondary)' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => removeHistoryItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                          title="Remove"
                        >
                          <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
