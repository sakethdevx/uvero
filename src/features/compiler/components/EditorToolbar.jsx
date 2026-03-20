import React from 'react';
import { getTemplateNames } from '../data/languages';

export default function EditorToolbar({ language, isLoading, onRun, onReset, onCopy, fontSize, onFontSizeChange, templateName, onTemplateChange }) {
    const templates = getTemplateNames(language);

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/80 dark:bg-[#0f1419] border-b border-gray-200 dark:border-white/5 rounded-t-2xl">
            {/* Left: Run + Reset */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onRun}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-95 ${
                        isLoading
                            ? 'bg-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Run
                        </>
                    )}
                </button>

                <button
                    onClick={onReset}
                    title="Reset to template"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>

                <button
                    onClick={onCopy}
                    title="Copy code"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

                {/* Template selector */}
                {templates.length > 1 && (
                    <select
                        value={templateName}
                        onChange={(e) => onTemplateChange(e.target.value)}
                        className="text-xs font-medium bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                    >
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Right: Font size + shortcut hint */}
            <div className="flex items-center gap-2">
                {/* Font size */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-1">
                    <button
                        onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
                        className="px-1.5 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        A-
                    </button>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono w-5 text-center">{fontSize}</span>
                    <button
                        onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
                        className="px-1.5 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        A+
                    </button>
                </div>

                {/* Shortcut hint */}
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[10px]">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[10px]">↵</kbd>
                </div>
            </div>
        </div>
    );
}
