/**
 * Component to display file information
 * Shows file name, size, and optional comparison
 */
export default function FileInfo({ file, compressedSize = null, showComparison = false, variant = 'default' }) {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const calculateReduction = () => {
        if (!compressedSize || !file) return 0;
        return Math.round(((file.size - compressedSize) / file.size) * 100);
    };

    const reduction = calculateReduction();
    const isGhost = variant === 'ghost';

    return (
        <div className={isGhost ? "" : "glass-subtle p-5 rounded-2xl bg-white/5 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 transition-all duration-300"}>
            <div className="flex items-center gap-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <svg
                            className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate mb-1 uppercase tracking-tight">
                        {file?.name || 'Unknown file'}
                    </h3>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Size: <span className="text-gray-700 dark:text-gray-300 font-black">{formatFileSize(file?.size || 0)}</span>
                            </span>

                            {showComparison && compressedSize && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">→</span>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{formatFileSize(compressedSize)}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {showComparison && compressedSize && reduction > 0 && (
                            <div className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.1em]">
                                    {reduction}% optimized
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
