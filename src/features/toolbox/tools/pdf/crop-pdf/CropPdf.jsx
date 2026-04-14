import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import cropPdfExecutor from './executor';

export default function CropPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [cropMargins, setCropMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [allPages, setAllPages] = useState(true);
    const [pageRange, setPageRange] = useState('');
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

    const applyPreset = (preset) => {
        switch (preset) {
            case 'none':
                setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 });
                break;
            case 'trim':
                setCropMargins({ top: 36, right: 36, bottom: 36, left: 36 });
                break;
            case 'a4':
                setCropMargins({ top: 28, right: 28, bottom: 28, left: 28 });
                break;
            case 'letter':
                setCropMargins({ top: 25, right: 25, bottom: 25, left: 25 });
                break;
            default:
                break;
        }
    };

    const handleMarginChange = (side, value) => {
        const numValue = Math.max(0, Math.min(200, parseInt(value) || 0));
        setCropMargins(prev => ({ ...prev, [side]: numValue }));
    };

    const handleCrop = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await cropPdfExecutor.run({
                files: [file],
                options: { ...cropMargins, allPages, pageRange },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);

            setProgress(100);
        } catch (err) {
            console.error('Crop error:', err);
            setError(err.message || 'Failed to crop PDF. Please try again.');
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
        setCropMargins({ top: 0, right: 0, bottom: 0, left: 0 });
        setAllPages(true);
        setPageRange('');
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

                        {/* File Info & Crop Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Preset Options */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Crop Presets
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <button
                                            onClick={() => applyPreset('none')}
                                            disabled={isProcessing}
                                            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all text-center text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            No Crop
                                        </button>
                                        <button
                                            onClick={() => applyPreset('trim')}
                                            disabled={isProcessing}
                                            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all text-center text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Trim Margins
                                        </button>
                                        <button
                                            onClick={() => applyPreset('a4')}
                                            disabled={isProcessing}
                                            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all text-center text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            A4 Crop
                                        </button>
                                        <button
                                            onClick={() => applyPreset('letter')}
                                            disabled={isProcessing}
                                            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all text-center text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Letter Crop
                                        </button>
                                    </div>
                                </div>

                                {/* Margin Inputs */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Crop Margins (points)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {['top', 'right', 'bottom', 'left'].map((side) => (
                                            <div key={side}>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">{side}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="200"
                                                    value={cropMargins[side]}
                                                    onChange={(e) => handleMarginChange(side, e.target.value)}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Page Selection */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Page Selection
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allPages}
                                                onChange={(e) => setAllPages(e.target.checked)}
                                                disabled={isProcessing}
                                                className="w-4 h-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">Apply to all pages</span>
                                        </label>
                                        {!allPages && (
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Page range (e.g., 1-3,5,7-9)</label>
                                                <input
                                                    type="text"
                                                    value={pageRange}
                                                    onChange={(e) => setPageRange(e.target.value)}
                                                    disabled={isProcessing}
                                                    placeholder="1-3,5,7-9"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                                                />
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
                                        onClick={handleCrop}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Cropping...' : 'Crop PDF'}
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
                                                PDF Cropped Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Your PDF has been cropped with the specified margins.
                                            </p>
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
                                        Download Cropped PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Crop Another
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
