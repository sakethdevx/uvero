import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

export default function RotatePdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [angle, setAngle] = useState(90);
    const [pageMode, setPageMode] = useState('all'); // 'all' or 'specific'
    const [pageInput, setPageInput] = useState('');
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

    const handleRotate = async () => {
        if (!file) return;

        if (pageMode === 'specific' && !pageInput.trim()) {
            setError('Please enter page numbers to rotate');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const pageSpec = pageMode === 'all' ? 'all' : pageInput.trim();
            const rotatedBlob = await processor.rotate(
                file,
                angle,
                pageSpec,
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                url: URL.createObjectURL(rotatedBlob),
                size: rotatedBlob.size
            });

            setProgress(100);
        } catch (err) {
            console.error('Rotation error:', err);
            setError(err.message || 'Failed to rotate PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = `rotated_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
        setPageMode('all');
        setPageInput('');
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

    const angleOptions = [
        { value: 90, label: '90°', description: 'Quarter turn right' },
        { value: 180, label: '180°', description: 'Half turn' },
        { value: 270, label: '270°', description: 'Quarter turn left' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-gray-900 via-white to-blue-50 dark:to-gray-800">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔄</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Rotator
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Rotate PDF pages online for free. Choose any angle and select specific pages or rotate them all.
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

                        {/* File Info & Rotation Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Rotation Angle Selector */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Rotation Angle (Clockwise)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {angleOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAngle(opt.value)}
                                                disabled={isProcessing}
                                                className={`p-4 rounded-lg border-2 transition-all text-left ${angle === opt.value
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white mb-1">{opt.label}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">{opt.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Page Selection */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Pages to Rotate
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        <button
                                            onClick={() => setPageMode('all')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${pageMode === 'all'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">All Pages</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Rotate every page in the PDF</div>
                                        </button>
                                        <button
                                            onClick={() => setPageMode('specific')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${pageMode === 'specific'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Specific Pages</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Choose which pages to rotate</div>
                                        </button>
                                    </div>
                                    {pageMode === 'specific' && (
                                        <div>
                                            <input
                                                type="text"
                                                value={pageInput}
                                                onChange={(e) => setPageInput(e.target.value)}
                                                placeholder="e.g. 1,3,5-7"
                                                disabled={isProcessing}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50"
                                            />
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Enter page numbers separated by commas. Use hyphens for ranges (e.g. 1,3,5-7).
                                            </p>
                                        </div>
                                    )}
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
                                        onClick={handleRotate}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Rotating...' : 'Rotate PDF'}
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
                                                PDF Rotated Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                {pageMode === 'all' ? 'All pages' : `Pages ${pageInput}`} rotated by <span className="font-bold text-green-700 dark:text-green-300">{angle}°</span> clockwise.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Original Size</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{formatFileSize(file.size)}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Rotated Size</div>
                                                    <div className="font-semibold text-green-700 dark:text-green-300">{formatFileSize(result.size)}</div>
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
                                        Download Rotated PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Rotate Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Web Worker technology ensures smooth rotation without freezing your browser.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Precise Control</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Rotate all pages or select specific ones. Choose 90°, 180°, or 270° clockwise.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-purple-600 dark:text-purple-400">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-blue-600 dark:text-blue-400">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Choose Angle</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Select rotation angle and pages to rotate</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rotate</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click rotate and watch the magic happen</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your rotated PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How does PDF rotation work?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Our tool modifies the page rotation property inside the PDF document. The content itself is not
                                re-rendered — only the display orientation changes, so quality is always preserved.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Which rotation angle should I choose?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                <strong>90° (clockwise):</strong> Rotates a quarter turn to the right — ideal for landscape-to-portrait conversion.<br />
                                <strong>180°:</strong> Flips pages upside down — useful for scanned documents that were fed the wrong way.<br />
                                <strong>270° (clockwise):</strong> Rotates a quarter turn to the left — another way to fix orientation.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I rotate only specific pages?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Select "Specific Pages" and enter the page numbers you want to rotate. You can use commas
                                to separate individual pages (e.g. 1,3,5) and hyphens for ranges (e.g. 1-3,7-9).
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All rotation happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can rotate PDFs up to 100MB. Rotation is a lightweight operation, so even large
                                files are processed quickly.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will rotation affect PDF quality?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                No. Rotation only changes the page orientation metadata — text, images, and all other
                                content remain exactly as they were. There is zero quality loss.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I rotate password-protected PDFs?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Currently, password-protected PDFs cannot be rotated. Please remove the password protection first,
                                rotate the file, and then re-apply password protection if needed.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF rotator is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your rotated PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
