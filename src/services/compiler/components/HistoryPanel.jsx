import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getLanguageById } from '../data/languages';

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}

const STATUS_CONFIG = {
    success: { icon: '✅', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    runtime_error: { icon: '❌', color: 'text-red-500', bg: 'bg-red-500/10' },
    compilation_error: { icon: '🔨', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    timeout: { icon: '⏱', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    error: { icon: '⚠️', color: 'text-red-500', bg: 'bg-red-500/10' },
    cancelled: { icon: '🚫', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export default function HistoryPanel({ isOpen, onClose, runs, onLoadRun, onDeleteRun, onClearHistory }) {
    const [confirmClear, setConfirmClear] = useState(false);

    if (!isOpen) return null;

    const handleClear = () => {
        if (confirmClear) {
            onClearHistory();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed left-0 right-0 bottom-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
                style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
                onClick={onClose}
            />

            {/* Panel */}
            <div 
                className="fixed right-0 bottom-0 z-[70] w-full sm:w-[460px] glass-panel rounded-none sm:rounded-l-3xl sm:rounded-r-none flex flex-col animate-panel-in"
                style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                    {/* Abstract background effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] -z-10" />
                    <div className="absolute top-10 left-10 w-24 h-24 bg-blue-600/10 blur-[50px] -z-10" />
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Execution History</h2>
                                    <span 
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                                    >
                                        {runs.length}
                                    </span>
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Stored locally on your device</p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div 
                    className="px-6 py-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}
                >
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>Private Storage</span>
                    </div>

                    {runs.length > 0 && (
                        <button
                            onClick={handleClear}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                confirmClear
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10'
                            }`}
                            style={!confirmClear ? { color: 'var(--text-secondary)' } : undefined}
                        >
                            {confirmClear ? 'Confirm Clear?' : 'Clear History'}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    {runs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10 py-12 gap-4">
                            <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-glass)' }}
                            >
                                <svg className="w-7 h-7" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="text-center max-w-xs">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No execution history</h3>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    Your compiled runs will appear here automatically.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {runs.map((run) => {
                                const lang = getLanguageById(run.language);
                                const firstLine = (run.code || '').split('\n')[0].slice(0, 60);
                                const status = STATUS_CONFIG[run.status] || STATUS_CONFIG.error;

                                return (
                                    <div
                                        key={run.id}
                                        className="group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] bg-white/40 dark:bg-white/[0.01] hover:bg-white/80 dark:hover:bg-white/[0.03]"
                                        style={{ border: '1px solid var(--border-glass)' }}
                                        onClick={() => onLoadRun(run)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon with status ring */}
                                            <div className="relative shrink-0">
                                                <div 
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110 shadow-sm"
                                                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-glass)' }}
                                                >
                                                    {lang?.icon || '📄'}
                                                </div>
                                                <div 
                                                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${status.bg} border-2 flex items-center justify-center text-[10px] shadow-sm`}
                                                    style={{ borderColor: 'var(--surface-1)' }}
                                                >
                                                    {status.icon}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                            {lang?.name || run.language}
                                                        </h4>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                                            {timeAgo(run.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <p className="text-[10px] font-mono font-bold text-emerald-500 dark:text-emerald-400/80">{run.executionTime.toFixed(0)}ms</p>
                                                        
                                                        {/* Delete button (inline to prevent overlap) */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteRun(run.id);
                                                            }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Code excerpt block */}
                                                <div 
                                                    className="rounded-xl p-2.5 mt-2 transition-colors"
                                                    style={{ 
                                                        border: '1px solid var(--border-glass)', 
                                                        background: 'var(--surface-2)',
                                                    }}
                                                >
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                                                        {firstLine || '(empty source)'}
                                                    </p>
                                                    {run.stdout && (
                                                        <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/40 font-mono truncate mt-1">
                                                            → {run.stdout.split('\n')[0].slice(0, 50)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div 
                    className="px-6 py-4"
                    style={{ 
                        borderTop: '1px solid var(--border-glass)',
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
                    }}
                >
                    <p className="text-[10px] leading-relaxed text-center" style={{ color: 'var(--text-secondary)' }}>
                        History is stored in your browser's local cache. 
                        <br />Clearing cache will remove this data permanently.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes panel-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-panel-in { animation: panel-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.1); border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.2); }
            `}</style>
        </>,
        document.body
    );
}
