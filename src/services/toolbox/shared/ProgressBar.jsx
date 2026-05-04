/**
 * Progress Bar component with percentage display
 */
export default function ProgressBar({ progress, label = '' }) {
    return (
        <div className="w-full space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    {label || 'Engine Processing'}
                </span>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {Math.round(progress)}%
                </span>
            </div>
            <div className="relative w-full bg-gray-100 dark:bg-white/[0.03] rounded-full h-4 overflow-hidden border border-gray-200 dark:border-white/5 shadow-inner">
                {/* Progress Fill */}
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-apple-in-out shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                >
                    {/* Gloss Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-[40%]" />
                </div>
            </div>
        </div>
    );
}
