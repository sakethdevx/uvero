import React, { useState } from 'react';

export default function StdinPanel({ value, onChange }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border-b border-gray-200/70 dark:border-white/[0.06] transition-all duration-300">
            {/* Toggle header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <svg
                        className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="currentColor" viewBox="0 0 24 24"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Standard Input
                    </span>
                    {value && !isExpanded && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono bg-gray-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                            {value.length} chars
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-gray-300 dark:text-gray-700 font-mono">stdin</span>
            </button>

            {/* Textarea */}
            {isExpanded && (
                <div className="px-4 pb-3 animate-expand">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter input for your program here…"
                        className="w-full h-24 bg-white dark:bg-black/20 border border-gray-200/70 dark:border-white/[0.06] rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/30 transition-all resize-y text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <div className="flex justify-end mt-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                            {value.length} chars · {value.split('\n').length} lines
                        </span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes expand {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-expand { animation: expand 0.15s ease-out both; }
            `}</style>
        </div>
    );
}
