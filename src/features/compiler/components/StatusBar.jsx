import React from 'react';

export default function StatusBar({ language, cursorPosition, charCount, lineCount, lastExecTime, status }) {
    return (
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 dark:bg-[#0a0e14] border-t border-gray-200 dark:border-white/5 text-[10px] font-mono text-gray-400 dark:text-gray-600 rounded-b-2xl select-none">
            {/* Left */}
            <div className="flex items-center gap-3">
                {language && (
                    <span className="flex items-center gap-1.5">
                        <span>{language.icon}</span>
                        <span>{language.name}</span>
                    </span>
                )}
                {language && (
                    <span className="text-gray-300 dark:text-gray-700">{language.extension}</span>
                )}
                {cursorPosition && (
                    <span>
                        Ln {cursorPosition.line}, Col {cursorPosition.column}
                    </span>
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
                    <span className="text-emerald-500 dark:text-emerald-600">⚡ {lastExecTime.toFixed(0)}ms</span>
                )}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700">Uvero Compiler Engine</span>
            </div>
        </div>
    );
}
