import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import organizePdfExecutor from './executor';

export default function OrganizePdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [pages, setPages] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);

        try {
            const info = await organizePdfExecutor.getPageInfo(selectedFile);
            setPages(Array.from({ length: info.totalPages }, (_, i) => i));
        } catch (err) {
            console.error('Error reading PDF:', err);
            setError('Failed to read PDF file. Please try again.');
            setFile(null);
        }
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newPages = [...pages];
        [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
        setPages(newPages);
    };

    const handleMoveDown = (index) => {
        if (index === pages.length - 1) return;
        const newPages = [...pages];
        [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
        setPages(newPages);
    };

    const handleRemovePage = (index) => {
        if (pages.length <= 1) {
            setError('Cannot remove the last page');
            return;
        }
        const newPages = [...pages];
        newPages.splice(index, 1);
        setPages(newPages);
    };

    const handleApply = async () => {
        if (!file || pages.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await organizePdfExecutor.run({
                files: [file],
                options: {
                    pageOrder: pages,
                },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);

            setProgress(100);
        } catch (err) {
            console.error('Organize error:', err);
            setError(err.message || 'Failed to organize PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.primaryFile) return;

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.primaryFile.name;
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
        setPages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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

                        {/* Page List & Controls */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Organizer */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Page Order
                                        </label>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{pages.length} pages</span>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto space-y-2">
                                        {pages.map((pageIndex, index) => (
                                            <div
                                                key={`${index}-${pageIndex}`}
                                                className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                            >
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8 text-center">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        📄 Original Page {pageIndex + 1}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-gray-100 dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
                                                        title="Move up"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === pages.length - 1 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-gray-100 dark:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
                                                        title="Move down"
                                                    >
                                                        ▼
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemovePage(index)}
                                                        disabled={pages.length <= 1 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-red-50 dark:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed text-red-500"
                                                        title="Remove page"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
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
                                        onClick={handleApply}
                                        disabled={isProcessing || pages.length === 0}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Processing...' : 'Apply Changes'}
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
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                PDF Organized Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Your PDF pages have been reorganized. The new PDF has {pages.length} pages.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Organized PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Organize Another
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
