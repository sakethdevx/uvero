import React, { useState } from 'react';

export default function StdinPanel({ value, onChange }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 shadow-sm">
            {/* Toggle header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg
                        className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="currentColor" viewBox="0 0 24 24"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Standard Input
                    </span>
                    {value && !isExpanded && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate max-w-[120px]">
                            ({value.length} chars)
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">stdin</span>
            </button>

            {/* Textarea */}
            {isExpanded && (
                <div className="px-3 pb-3">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter input for your program here..."
                        className="w-full h-20 bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-white/5 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/30 transition-all resize-y text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">
                            {value.length} chars · {value.split('\n').length} lines
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
