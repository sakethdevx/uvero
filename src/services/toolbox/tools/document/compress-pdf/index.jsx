import { useState, useCallback } from 'react';
import { usePdfCompress } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';

export const metadata = {
    id: 'compress-pdf',
    name: 'Compress PDF',
    category: 'document',
    keywords: ['compress', 'reduce', 'size', 'pdf', 'optimize'],
    icon: '🗜️',
    offline: true,
    experimental: true,
    multiFile: true,
    pageBased: false,
    securityTool: false,
    workspace: 'pdf-tools',
    processing: 'local-react',
    accepts: ['.pdf'],
    maxFiles: 100
};

const QUALITY_OPTIONS = [
    { value: 'low', label: 'Low (Maximum compression)' },
    { value: 'medium', label: 'Medium (Balanced)' },
    { value: 'high', label: 'High (Best quality)' }
];

export default function CompressPdfTool({ initialFiles = [] }) {
    const [files, setFiles] = useState(initialFiles);
    const [compressionLevel, setCompressionLevel] = useState('medium');

    const { compress, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfCompress();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
            const isDuplicate = prev.some(f => f.name === newFile.name && f.size === newFile.size);
            if (isDuplicate) return prev;
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, newFile];
        });
    }, []);

    const handleRemove = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        if (result) reset();
    };

    const handleCompress = () => {
        compress(files, { compressionLevel });
    };

    const handleRestart = () => {
        setFiles([]);
        setCompressionLevel('medium');
        reset();
    };

    const getCompressionSaving = () => {
        if (result?.metadata?.compressionRatio != null) {
            return result.metadata.compressionRatio > 0
                ? `Saved ${result.metadata.compressionRatio}% (${formatBytes(result.metadata.originalSize - result.metadata.compressedSize)})`
                : `Size increased by ${-result.metadata.compressionRatio}%`;
        }
        return '';
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {files.length === 0 && !result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drag & drop a PDF file here or click to browse"
                />
            )}

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Compress PDF ({files.length} file)</h3>
                        <p className="text-sm text-gray-500">Only one file can be processed at a time</p>
                    </div>

                    <div className="space-y-4">
                        {/* Compression Level Selector */}
                        <div className="space-y-2">
                            <p className="font-medium">Compression Level</p>
                            <div className="flex flex-wrap gap-3">
                                {QUALITY_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition-colors ${compressionLevel === opt.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="compressionLevel"
                                            value={opt.value}
                                            checked={compressionLevel === opt.value}
                                            onChange={(e) => setCompressionLevel(e.target.value)}
                                            disabled={isProcessing}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {QUALITY_OPTIONS.find(o => o.value === compressionLevel)?.label}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                <p className="font-medium">Processing Error</p>
                                <p>{error.message}</p>
                            </div>
                        )}

                        {isProcessing ? (
                            <div className="space-y-4">
                                <ProgressBar progress={progress} />
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>{progressMessage}</p>
                                    <Button onClick={cancel} variant="outline" className="text-red-500 border-red-200">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setFiles([])} variant="outline">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleCompress}
                                    disabled={files.length === 0}
                                    className={
                                        files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    }
                                >
                                    Compress PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-green-200 dark:border-green-800 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">Compression Complete!</h2>
                        <p className="text-gray-500">
                            Successfully compressed {result.metadata.pageCount} pages.
                        </p>
                        {getCompressionSaving() && (
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                                {getCompressionSaving()}
                            </p>
                        )}
                        <div className="flex justify-center gap-4 text-sm text-gray-500 mt-1">
                            <span>Original: {formatBytes(result.metadata.originalSize)}</span>
                            <span>→</span>
                            <span>Compressed: {formatBytes(result.metadata.compressedSize)}</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleRestart} variant="outline">
                            Start Over
                        </Button>
                        <Button
                            onClick={() => {
                                const url = URL.createObjectURL(result.blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Download Compressed PDF
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
