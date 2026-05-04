import { useSession } from '../lib/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FavoritesSheet — Displays pinned capabilities for quick access.
 * Follows the same design language as HistorySheet.
 */
export default function FavoritesSheet({ isOpen, onClose, onRerun }) {
  const { favorites, toggleFavorite, isFavorite } = useSession();

  // Example prompts for the empty state
  const suggestions = [
    { id: 'file-convert', label: 'Convert File', icon: '⚡', description: 'Convert any file type' },
    { id: 'qr-generate-quick', label: 'Generate QR', icon: '🔳', description: 'URL or Text → QR' },
    { id: 'clipboard-share', label: 'Quick Share', icon: '📋', description: 'Text → 4-digit code' },
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Favorites</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  {favorites.length}
                </span>
              </div>
              <button onClick={onClose}
                className="w-11 h-11 -mr-2 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-2)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No favorites yet</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Pin your favorite tools for quick access.
                </p>
              </div>
              
              <div className="w-full mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Helpful suggestions
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onRerun?.({ capability: s.id, action: s.label, icon: s.icon, description: s.description, params: {} });
                        onClose?.();
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/[0.03] text-left"
                      style={{ border: '1px solid var(--border-glass)' }}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                      </div>
                      <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {favorites.map((item) => (
                <div key={item.id + JSON.stringify(item.params)}
                  className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  style={{ border: '1px solid var(--border-glass)' }}
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { 
                        onRerun?.({ 
                          capability: item.id, 
                          action: item.label, 
                          icon: item.icon, 
                          description: item.description,
                          params: item.params 
                        }); 
                        onClose?.(); 
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                      }}
                    >
                      Run
                    </button>
                    <button
                      onClick={() => toggleFavorite(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                      title="Unpin"
                    >
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
