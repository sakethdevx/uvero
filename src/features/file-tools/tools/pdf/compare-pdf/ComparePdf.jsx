import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import comparePdfExecutor from './executor';

export default function ComparePdf() {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInput1Ref = useRef(null);
    const fileInput2Ref = useRef(null);

    const handleFileSelect1 = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile1(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleFileSelect2 = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile2(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleCompare = async () => {
        if (!file1 || !file2) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await comparePdfExecutor.run({
                files: [file1, file2],
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);
            setProgress(100);
        } catch (err) {
            console.error('Comparison error:', err);
            setError(err.message || 'Failed to compare PDFs. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile1(null);
        setFile2(null);
        setResult(null);
        setError(null);
        setProgress(0);
        if (fileInput1Ref.current) fileInput1Ref.current.value = '';
        if (fileInput2Ref.current) fileInput2Ref.current.value = '';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const comparison = result?.meta;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:to-gray-800">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔍</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Compare PDFs
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Compare two PDF files side by side and find differences. Fast, secure, and completely free.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>No Upload Required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Privacy First</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Unlimited Use</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tool Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Dual Dropzones */}
                        {!comparison && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Original PDF</h3>
                                        {!file1 ? (
                                            <Dropzone
                                                onFileSelect={handleFileSelect1}
                                                accept=".pdf,application/pdf"
                                                maxSize={100 * 1024 * 1024}
                                                fileInputRef={fileInput1Ref}
                                                label="Drop original PDF here"
                                                description="or click to browse"
                                            />
                                        ) : (
                                            <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <span className="text-lg">📄</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file1.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file1.size)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setFile1(null); setResult(null); }}
                                                        disabled={isProcessing}
                                                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Modified PDF</h3>
                                        {!file2 ? (
                                            <Dropzone
                                                onFileSelect={handleFileSelect2}
                                                accept=".pdf,application/pdf"
                                                maxSize={100 * 1024 * 1024}
                                                fileInputRef={fileInput2Ref}
                                                label="Drop modified PDF here"
                                                description="or click to browse"
                                            />
                                        ) : (
                                            <div className="border-2 border-yellow-200 dark:border-yellow-800/30 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <span className="text-lg">📄</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file2.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file2.size)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setFile2(null); setResult(null); }}
                                                        disabled={isProcessing}
                                                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                                        onClick={handleCompare}
                                        disabled={!file1 || !file2 || isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Comparing...' : 'Compare PDFs'}
                                    </Button>
                                    {(file1 || file2) && (
                                        <Button
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {comparison && (
                            <div className="space-y-6">
                                {/* Summary */}
                                <div className={`border rounded-xl p-6 ${comparison.totalDiffs === 0
                                    ? 'bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border-green-200 dark:border-green-800/30'
                                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:to-gray-800 border-amber-200'
                                }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${comparison.totalDiffs === 0 ? 'bg-green-500' : 'bg-amber-500'
                                        }`}>
                                            <span className="text-2xl">{comparison.totalDiffs === 0 ? '✓' : '⚠'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {comparison.totalDiffs === 0
                                                    ? 'PDFs are identical!'
                                                    : `Found differences in ${comparison.totalDiffs} of ${comparison.totalPages} page${comparison.totalPages !== 1 ? 's' : ''}`
                                                }
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-gray-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Original PDF</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{comparison.file1Pages} page{comparison.file1Pages !== 1 ? 's' : ''}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-gray-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Modified PDF</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{comparison.file2Pages} page{comparison.file2Pages !== 1 ? 's' : ''}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Per-page differences */}
                                {comparison.differences.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Page-by-Page Results</h3>
                                        {comparison.differences.map((diff) => (
                                            <div key={diff.page} className={`border rounded-lg p-4 ${diff.identical
                                                ? 'border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/20'
                                                : 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-sm font-semibold ${diff.identical ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                                        Page {diff.page}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${diff.identical
                                                        ? 'bg-green-200 text-green-800 dark:text-green-200'
                                                        : 'bg-red-200 text-red-800 dark:text-red-200'
                                                    }`}>
                                                        {diff.identical ? 'Identical' : 'Different'}
                                                    </span>
                                                </div>
                                                {!diff.identical && (
                                                    <div className="space-y-2 text-sm">
                                                        {diff.removed.length > 0 && (
                                                            <div className="bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/30 rounded p-2">
                                                                <span className="font-semibold text-red-800 dark:text-red-200">Removed: </span>
                                                                <span className="text-red-700 dark:text-red-300">{diff.removed.slice(0, 20).join(', ')}{diff.removed.length > 20 ? ` ... and ${diff.removed.length - 20} more` : ''}</span>
                                                            </div>
                                                        )}
                                                        {diff.added.length > 0 && (
                                                            <div className="bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800/30 rounded p-2">
                                                                <span className="font-semibold text-green-800 dark:text-green-200">Added: </span>
                                                                <span className="text-green-700 dark:text-green-300">{diff.added.slice(0, 20).join(', ')}{diff.added.length > 20 ? ` ... and ${diff.added.length - 20} more` : ''}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleReset}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Compare Another Pair
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Comparison</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quickly compare documents page by page with detailed text-level difference reports.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Detailed Results</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            See exactly what changed — added and removed text highlighted per page.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-amber-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Original</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select the original PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Modified</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Add the modified version of the PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-orange-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Compare</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click compare and let the tool analyze both files</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Review</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">See detailed differences page by page</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How does PDF comparison work?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Our tool extracts the text content from each page of both PDFs and compares them word by word.
                                Differences are highlighted so you can quickly see what changed between versions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What types of differences can it detect?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                The tool detects text-level differences including added words, removed words, and changed content.
                                It also identifies page count changes between the two documents.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Are my PDFs secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDFs never leave your device. All comparison happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can compare PDFs up to 100MB each. For best performance with large files,
                                ensure you have sufficient browser memory available.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can it compare scanned PDFs?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                The tool compares text content extracted from PDFs. Scanned documents that contain only images
                                without embedded text may show limited results. For best results, use PDFs with selectable text.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF comparison tool is completely free with unlimited usage. No sign-up, no hidden fees.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
