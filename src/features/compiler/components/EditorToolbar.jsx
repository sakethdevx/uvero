import LanguageSelector from './LanguageSelector';
import ShareButton from './ShareButton';

export default function EditorToolbar({ language, onLanguageChange, isLoading, onRun, onReset, onCopy, onShare, onHistoryToggle, fontSize, onFontSizeChange }) {
    return (
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 bg-white/90 dark:bg-[#161b22] border-b border-gray-200/70 dark:border-white/[0.06] backdrop-blur-sm shadow-sm z-30">
            {/* Left: Run + Language Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Run Button */}
                <button
                    onClick={onRun}
                    disabled={isLoading}
                    className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-95 overflow-hidden ${
                        isLoading
                            ? 'bg-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                    }`}
                >
                    {/* Shimmer effect */}
                    {!isLoading && (
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    {isLoading ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="hidden sm:inline">Running…</span>
                            <span className="sm:hidden">…</span>
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

                <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.08] mx-0.5" />

                <LanguageSelector 
                    selectedLanguage={language} 
                    onLanguageChange={onLanguageChange} 
                />

                <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.08] mx-0.5" />

                {/* Icon buttons */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onReset}
                        title="Reset to Template"
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    <button
                        onClick={onCopy}
                        title="Copy code"
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>

                    <ShareButton onShare={onShare} />
                </div>
            </div>

            {/* Right: Font size + History */}
            <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Font size */}
                <div className="hidden sm:flex items-center gap-0.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.08] rounded-lg px-1 h-8">
                    <button
                        onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
                        className="px-1.5 py-1 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >A−</button>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono w-5 text-center">{fontSize}</span>
                    <button
                        onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
                        className="px-1.5 py-1 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >A+</button>
                </div>

                {/* Shortcut hint */}
                <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.08] rounded text-[10px] shadow-sm">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.08] rounded text-[10px] shadow-sm">↵</kbd>
                </div>

                {/* History toggle */}
                <button
                    onClick={onHistoryToggle}
                    title="Execution History"
                    className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-all group"
                >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {/* Shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
                .animate-shimmer { animation: shimmer 3s infinite; }
            `}</style>
        </div>
    );
}
