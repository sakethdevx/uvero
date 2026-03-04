import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

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
            const croppedBlob = await processor.crop(
                file,
                { ...cropMargins, allPages, pageRange },
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                blob: croppedBlob,
                url: URL.createObjectURL(croppedBlob)
            });

            setProgress(100);
        } catch (err) {
            console.error('Crop error:', err);
            setError(err.message || 'Failed to crop PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = `cropped_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-green-50">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-lime-500 to-green-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">✂️</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Cropper
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Crop PDF pages by trimming margins. Apply to all or specific pages.
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
                                                className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
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
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 text-sm">{error}</p>
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
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
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

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">✂️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Precise Cropping</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Set exact margins in points or use preset crop options for common paper sizes.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📑</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Page Selection</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Crop all pages at once or specify individual pages and ranges.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-lime-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Set Margins</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose a preset or set custom crop margins</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-emerald-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Crop</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click crop and the margins are applied instantly</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-teal-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your cropped PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How does PDF cropping work?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                PDF cropping adjusts the CropBox of each page, which defines the visible area. The original content remains in the file but only the cropped area is displayed and printed.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What are the crop presets?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                <strong>No Crop:</strong> Resets all margins to zero.<br />
                                <strong>Trim Margins:</strong> Applies a 36-point (0.5 inch) trim on all sides.<br />
                                <strong>A4 Crop:</strong> Applies a 28-point crop optimized for A4 paper.<br />
                                <strong>Letter Crop:</strong> Applies a 25-point crop optimized for US Letter paper.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What are "points" in margin settings?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Points are a standard typographic unit used in PDFs. 1 point equals 1/72 of an inch. So 72 points equals 1 inch, and 36 points equals 0.5 inches.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I crop specific pages only?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Uncheck "Apply to all pages" and enter a page range like "1-3,5,7-9" to crop only specific pages. Pages not included in the range will remain unchanged.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All cropping happens locally in your browser, ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF cropper is completely free with unlimited usage. No sign-up, no hidden fees, no watermarks on your cropped PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
