export default function StatusBar({ cursorPosition, charCount, lineCount, lastExecTime }) {
    return (
        <div className="flex items-center justify-between px-3 py-1 bg-gray-50/80 dark:bg-[#0a0e14] border-t border-gray-200/70 dark:border-white/[0.06] text-[10px] font-mono text-gray-400 dark:text-gray-600 select-none backdrop-blur-sm">
            {/* Left */}
            <div className="flex items-center gap-4">
                {cursorPosition && (
                    <span className="flex items-center gap-1.5 overflow-hidden">
                        <span className="opacity-60 text-[8px] uppercase tracking-wider">Pos</span>
                        <span className="text-gray-600 dark:text-gray-400">Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
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
