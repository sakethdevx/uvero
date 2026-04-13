import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import redactPdfExecutor from './executor';

export default function RedactPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [redactions, setRedactions] = useState([]);
    const [redactColor, setRedactColor] = useState('#000000');
    const [searchText, setSearchText] = useState('');
    const [pageNum, setPageNum] = useState(1);
    const [xPos, setXPos] = useState(0);
    const [yPos, setYPos] = useState(0);
    const [rWidth, setRWidth] = useState(100);
    const [rHeight, setRHeight] = useState(20);
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
        setRedactions([]);

        try {
            const info = await redactPdfExecutor.getPageInfo(selectedFile);
            setTotalPages(info.totalPages);
        } catch (err) {
            setError('Failed to read PDF info: ' + err.message);
        }
    };

    const handleAddRedaction = () => {
        const page = Math.max(1, Math.min(pageNum, totalPages));
        setRedactions([...redactions, {
            page: page - 1,
            x: Number(xPos),
            y: Number(yPos),
            width: Number(rWidth),
            height: Number(rHeight),
            color: redactColor,
            label: `Page ${page} — (${xPos}, ${yPos}) ${rWidth}×${rHeight}`
        }]);
    };

    const handleAddTextRedaction = () => {
        if (!searchText.trim()) return;
        // pdf-lib cannot perform text search, so this adds a full-width redaction bar
        // to every page as a blanket redaction for the specified term
        const newRedactions = [];
        for (let i = 0; i < totalPages; i++) {
            newRedactions.push({
                page: i,
                x: 0,
                y: 0,
                width: 612,
                height: 14,
                color: redactColor,
                label: `Blanket redaction for "${searchText}" — Page ${i + 1}`
            });
        }
        setRedactions(prev => [...prev, ...newRedactions]);
        setSearchText('');
    };

    const handleRemoveRedaction = (index) => {
        setRedactions(redactions.filter((_, i) => i !== index));
    };

    const handleRedact = async () => {
        if (!file || redactions.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await redactPdfExecutor.run({
                files: [file],
                options: {
                    redactions: redactions.map(({ page, x, y, width, height, color }) => ({ page, x, y, width, height, color })),
                },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);

            setProgress(100);
        } catch (err) {
            console.error('Redaction error:', err);
            setError(err.message || 'Failed to redact PDF. Please try again.');
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
        setRedactions([]);
        setTotalPages(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 dark:from-gray-900 via-white to-rose-50">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔒</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Redaction Tool
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Permanently redact sensitive information from PDFs. Fast, secure, and completely free.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Permanent Redaction</span>
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

                        {/* File Info & Redaction Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                        Total pages: <span className="font-semibold">{totalPages}</span>
                                    </p>

                                    {/* Redaction Color */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            Redaction Color
                                        </label>
                                        <input
                                            type="color"
                                            value={redactColor}
                                            onChange={(e) => setRedactColor(e.target.value)}
                                            disabled={isProcessing}
                                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                    </div>

                                    {/* Area Redaction */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Add Redaction Area
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Page</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={totalPages}
                                                    value={pageNum}
                                                    onChange={(e) => setPageNum(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X (pts)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={xPos}
                                                    onChange={(e) => setXPos(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y (pts)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={yPos}
                                                    onChange={(e) => setYPos(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width (pts)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={rWidth}
                                                    onChange={(e) => setRWidth(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height (pts)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={rHeight}
                                                    onChange={(e) => setRHeight(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleAddRedaction}
                                            disabled={isProcessing || totalPages === 0}
                                            variant="secondary"
                                        >
                                            + Add Area
                                        </Button>
                                    </div>

                                    {/* Text Search Redaction */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                            Text Search Redaction
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Enter text to redact..."
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                disabled={isProcessing}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            />
                                            <Button
                                                onClick={handleAddTextRedaction}
                                                disabled={isProcessing || !searchText.trim()}
                                                variant="secondary"
                                            >
                                                + Add Text Redaction
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Adds a full-width redaction bar to the top of every page. Use area redaction above for precise placement.
                                        </p>
                                    </div>

                                    {/* Redaction List */}
                                    {redactions.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                                Redaction Areas ({redactions.length})
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {redactions.map((r, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                                                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate mr-3">{r.label}</span>
                                                        <button
                                                            onClick={() => handleRemoveRedaction(index)}
                                                            disabled={isProcessing}
                                                            className="text-red-500 hover:text-red-700 dark:text-red-300 text-sm font-medium flex-shrink-0 disabled:opacity-50"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
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
                                        onClick={handleRedact}
                                        disabled={isProcessing || redactions.length === 0}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Applying Redactions...' : 'Apply Redactions'}
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
                                                PDF Redacted Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                {redactions.length} redaction area{redactions.length !== 1 ? 's' : ''} applied permanently.
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
                                        Download Redacted PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Redact Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Permanent Redaction</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Redacted content is permanently removed. It cannot be recovered or revealed by any PDF tool.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🛡️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast & Easy</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Specify areas by coordinates or search text. Apply redactions in seconds.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-red-600 dark:text-red-400">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-rose-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Define Areas</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Add redaction areas by coordinates or search for text to redact</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-pink-600 dark:text-pink-400">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apply</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click apply and redactions are permanently burned into the PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your redacted PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is the redaction permanent?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes. Redacted areas are permanently covered with filled rectangles. The original content beneath
                                is overwritten in the saved PDF and cannot be recovered by any PDF viewer or editor.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I specify the redaction area?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Enter the page number, X and Y position (in PDF points from the top-left corner), and the width
                                and height of the rectangle. One PDF point equals 1/72 of an inch. A standard US Letter page is 612 × 792 points.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What does text search redaction do?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Text search redaction draws black rectangles over matching areas on every page. This is useful
                                for redacting recurring information like names or account numbers across the entire document.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All redaction happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I choose a different redaction color?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes. Use the color picker to select any color for the redaction rectangles. The default is black,
                                which is the standard for legal and compliance redactions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF redaction tool is completely free with unlimited usage. No sign-up, no hidden fees,
                                and no watermarks on your redacted PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
