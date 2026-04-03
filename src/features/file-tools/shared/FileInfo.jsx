/**
 * Component to display file information
 * Shows file name, size, and optional comparison
 */
export default function FileInfo({ file, compressedSize = null, showComparison = false }) {
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

    return (
        <div className="card">
            <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-primary-600"
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
                    <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {file?.name || 'Unknown file'}
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                                Original: <span className="font-semibold text-gray-900">{formatFileSize(file?.size || 0)}</span>
                            </span>

                            {showComparison && compressedSize && (
                                <>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-gray-600">
                                        Compressed: <span className="font-semibold text-primary-600">{formatFileSize(compressedSize)}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {showComparison && compressedSize && reduction > 0 && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-semibold text-green-700">
                                    {reduction}% smaller
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
