import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import pdfCompressorExecutor from './executor';

export default function PDFCompressor() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [compressionLevel, setCompressionLevel] = useState('balanced'); // low, balanced, high
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const compressedResult = await pdfCompressorExecutor.run({
                files: [file],
                options: { compressionLevel },
                mode: 'offline',
                onProgress: setProgress,
            });
            setResult(compressedResult);
            setProgress(100);
        } catch (err) {
            console.error('Compression error:', err);
            setError(err.message || 'Failed to compress PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const originalSize = result?.meta?.originalSize ?? file?.size ?? 0;
    const compressedSize = result?.meta?.outputSize ?? result?.primaryFile?.size ?? 0;
    const savings = result?.meta?.reductionPercent ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Dropzone */}
                        {!file && (
                            <Dropzone
                                onFileSelect={handleFileSelect}
                                accept=".pdf,application/pdf"
                                maxSize={100 * 1024 * 1024}
                                fileInputRef={fileInputRef}
                                icon="📄"
                                title="Drop PDF here or click to browse"
                                subtitle="Maximum file size: 100MB"
                            />
                        )}

                        {/* File Info & Compression Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Compression Level Selector */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Compression Level
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setCompressionLevel('low')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${compressionLevel === 'low'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Low</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Minimal optimization</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Basic cleanup only</div>
                                        </button>
                                        <button
                                            onClick={() => setCompressionLevel('balanced')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${compressionLevel === 'balanced'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Balanced</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Recommended</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Structure optimization</div>
                                        </button>
                                        <button
                                            onClick={() => setCompressionLevel('high')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${compressionLevel === 'high'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">High</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Maximum optimization</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Removes all metadata</div>
                                        </button>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                                        <strong>Note:</strong> Compression results vary based on PDF content. Already-optimized PDFs may see minimal reduction. Best results with scanned documents and PDFs with uncompressed images.
                                    </div>
                                </div>

                                {/* Progress */}
                                {isProcessing && (
                                    <ProgressBar progress={progress} />
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCompress}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Compressing...' : 'Compress PDF'}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        disabled={isProcessing}
                                        variant="secondary"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="space-y-6">
                                {/* Success Message */}
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                PDF Compressed Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                Your PDF has been compressed by <span className="font-bold text-green-700 dark:text-green-300">{savings}%</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Original Size</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{formatFileSize(originalSize)}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Compressed Size</div>
                                                    <div className="font-semibold text-green-700 dark:text-green-300">{formatFileSize(compressedSize)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Compressed PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Compress Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
