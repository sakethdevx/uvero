import React, { useState } from 'react';
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

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-[#0a0a0f]/60 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-[70] w-full sm:w-[460px] bg-white dark:bg-[#0d1117] border-l border-gray-200 dark:border-white/[0.08] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col animate-panel-in">
                {/* Header */}
                <div 
                    className="relative px-6 pb-6"
                    style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}
                >
                    {/* Abstract background effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] -z-10" />
                    <div className="absolute top-10 left-10 w-24 h-24 bg-blue-600/10 blur-[50px] -z-10" />
                    
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Execution History</h2>
                                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{runs.length} Runs Stored Locally</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-xl transition-all border border-gray-200/50 dark:border-white/5"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01] border-y border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wide uppercase">Private Storage</span>
                    </div>

                    {runs.length > 0 && (
                        <button
                            onClick={handleClear}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                confirmClear
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                            }`}
                        >
                            {confirmClear ? 'Confirm Deletion?' : 'Clear History'}
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    {runs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/[0.04] dark:to-transparent border border-gray-200/50 dark:border-white/[0.08] flex items-center justify-center shadow-inner">
                                    <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-2 tracking-tight">Your code playground is empty</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Runs will appear here automatically. Everything is stored on your device and remains private to you.</p>
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
                                        className="group relative bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-2xl p-4 hover:border-blue-500/30 dark:hover:border-blue-500/20 hover:bg-gray-50 dark:hover:bg-blue-500/[0.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/5"
                                        onClick={() => onLoadRun(run)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon with status ring */}
                                            <div className="relative">
                                                <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110`}>
                                                    {lang?.icon || '📄'}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${status.bg} border-2 border-white dark:border-[#0d1117] flex items-center justify-center text-[10px] shadow-sm`}>
                                                    {status.icon}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex items-start justify-between mb-1.5">
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-blue-500 transition-colors">{lang?.name || run.language}</h4>
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{timeAgo(run.timestamp)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-mono font-bold text-emerald-500 dark:text-emerald-500/70">{run.executionTime.toFixed(0)}ms</p>
                                                    </div>
                                                </div>

                                                {/* Code excerpt block */}
                                                <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-2.5 mt-2 border border-gray-100 dark:border-white/[0.03]">
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

                                            {/* Delete button (absolute for better layout control) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteRun(run.id);
                                                }}
                                                className="absolute top-4 right-4 p-2 text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div 
                    className="px-6 pt-2 border-t border-gray-100 dark:border-white/[0.05] bg-gray-50/30 dark:bg-white/[0.01]"
                    style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed text-center">
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
        </>
    );
}
