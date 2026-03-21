import React from 'react';

export default function StatusBar({ language, cursorPosition, charCount, lineCount, lastExecTime, status }) {
    return (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/80 dark:bg-[#0a0e14] border-t border-gray-200/70 dark:border-white/[0.06] text-[10px] font-mono text-gray-400 dark:text-gray-600 select-none backdrop-blur-sm">
            {/* Left */}
            <div className="flex items-center gap-3">
                {language && (
                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
                        <span>{language.icon}</span>
                        <span className="font-semibold">{language.name}</span>
                    </span>
                )}
                {language && (
                    <span className="text-gray-300 dark:text-gray-700 bg-gray-100 dark:bg-white/[0.03] px-1.5 py-0.5 rounded">{language.extension}</span>
                )}
                {cursorPosition && (
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                {charCount !== undefined && (
                    <span>{charCount} chars</span>
                )}
                {lineCount !== undefined && (
                    <span>{lineCount} lines</span>
                )}
                {lastExecTime !== undefined && lastExecTime !== null && (
                    <span className="text-emerald-500 dark:text-emerald-500 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {lastExecTime.toFixed(0)}ms
                    </span>
                )}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">Uvero Compiler Engine</span>
            </div>
        </div>
    );
}
