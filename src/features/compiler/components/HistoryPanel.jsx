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

const STATUS_ICONS = {
    success: '✅',
    runtime_error: '❌',
    compilation_error: '🔨',
    timeout: '⏱',
    error: '⚠️',
    cancelled: '🚫',
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
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Execution History</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{runs.length} run{runs.length !== 1 ? 's' : ''} · stored locally</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Clear button */}
                {runs.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-2 border-b border-gray-50 dark:border-white/[0.03]">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            No login required
                        </span>

                        <button
                            onClick={handleClear}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                confirmClear
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                            }`}
                        >
                            {confirmClear ? 'Confirm Clear All' : 'Clear All'}
                        </button>
                    </div>
                )}

                {/* Entries */}
                <div className="flex-1 overflow-y-auto">
                    {runs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                            <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center mb-5">
                                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1">No executions yet</p>
                            <p className="text-xs text-gray-300 dark:text-gray-600">Run your first program to see it here</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {runs.map((run) => {
                                const lang = getLanguageById(run.language);
                                const firstLine = (run.code || '').split('\n')[0].slice(0, 60);
                                const statusIcon = STATUS_ICONS[run.status] || '⚠️';

                                return (
                                    <div
                                        key={run.id}
                                        className="group relative px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-all border-b border-gray-50 dark:border-white/[0.02] last:border-0"
                                        onClick={() => onLoadRun(run)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Language icon */}
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm">
                                                {lang?.icon || '📄'}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                        {lang?.name || run.language}
                                                    </span>
                                                    <span className="text-[10px]">{statusIcon}</span>
                                                    {run.executionTime > 0 && (
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                                            {run.executionTime.toFixed(0)}ms
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Code preview */}
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">
                                                    {firstLine || '(empty)'}
                                                </p>

                                                {/* Output preview */}
                                                {run.stdout && (
                                                    <p className="text-[10px] text-emerald-500/70 dark:text-emerald-500/50 font-mono truncate mt-0.5">
                                                        → {run.stdout.split('\n')[0].slice(0, 50)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Timestamp + delete */}
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                                    {timeAgo(run.timestamp)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteRun(run.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all rounded"
                                                    title="Delete"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Load indicator on hover */}
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out both; }
                .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}</style>
        </>
    );
}
