import React from 'react';
import LanguageSelector from './LanguageSelector';

export default function StatusBar({ language, onLanguageChange, cursorPosition, charCount, lineCount, lastExecTime, status }) {
    return (
        <div className="flex items-center justify-between px-4 py-2 bg-white/50 dark:bg-white/[0.02] border-t border-gray-200/80 dark:border-white/10 text-[11px] font-mono text-gray-500 dark:text-gray-400 select-none backdrop-blur-md relative z-20">
            {/* Left */}
            <div className="flex items-center gap-4">
                {language && (
                    <LanguageSelector 
                        selectedLanguage={language.id} 
                        onLanguageChange={onLanguageChange}
                        variant="status-bar"
                    />
                )}
                
                <div className="flex items-center gap-3">
                    {cursorPosition && (
                        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                    )}
                </div>
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
                <span className="hidden sm:inline text-gray-300 dark:text-gray-700 font-bold uppercase tracking-widest text-[9px]">Uvero Engine</span>
            </div>
        </div>
    );
}
