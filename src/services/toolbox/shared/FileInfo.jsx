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
        <div className={isGhost ? "" : "bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/5 transition-shadow duration-200"}>
            <div className="flex items-center gap-3 sm:gap-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                        <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5">
                        {file?.name || 'Unknown file'}
                    </h3>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                Size: <span className="text-gray-700 dark:text-gray-300 font-bold">{formatFileSize(file?.size || 0)}</span>
                            </span>

                            {showComparison && compressedSize && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">→</span>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        <span className="text-green-600 dark:text-green-400 font-bold">{formatFileSize(compressedSize)}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {showComparison && compressedSize && reduction > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">
                                    {reduction}% reduced
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
