import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

export default function PageNumbers() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [position, setPosition] = useState('bottom-center');
    const [startNumber, setStartNumber] = useState(1);
    const [fontSize, setFontSize] = useState(12);
    const [format, setFormat] = useState('plain');
    const [color, setColor] = useState('#000000');
    const [margin, setMargin] = useState(30);
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

    const handleProcess = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const blob = await processor.addPageNumbers(
                file,
                { position, startNumber, fontSize, format, color, margin },
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                url: URL.createObjectURL(blob),
                fileName: `numbered_${file.name}`
            });

            setProgress(100);
        } catch (err) {
            console.error('Page numbering error:', err);
            setError(err.message || 'Failed to add page numbers. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const positionOptions = [
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-right', label: 'Top Right' }
    ];

    const formatOptions = [
        { value: 'plain', label: '1, 2, 3...' },
        { value: 'page', label: 'Page 1, Page 2...' },
        { value: 'of', label: '1 of N, 2 of N...' },
        { value: 'dash', label: '- 1 -, - 2 -...' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">#️⃣</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Add Page Numbers to PDF
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Add customizable page numbers to your PDF files. Choose position, format, size, and color.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
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
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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

                        {/* File Info & Options */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Number Options */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                                        Page Number Settings
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Position */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Position</label>
                                            <select
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {positionOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Format */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Format</label>
                                            <select
                                                value={format}
                                                onChange={(e) => setFormat(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {formatOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Starting Number */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Starting Number</label>
                                            <input
                                                type="number"
                                                value={startNumber}
                                                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                                                min={1}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        {/* Font Size */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Font Size: {fontSize}pt</label>
                                            <input
                                                type="range"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                min={8}
                                                max={36}
                                                disabled={isProcessing}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Color</label>
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        {/* Margin Offset */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Margin Offset: {margin}px</label>
                                            <input
                                                type="range"
                                                value={margin}
                                                onChange={(e) => setMargin(parseInt(e.target.value))}
                                                min={10}
                                                max={100}
                                                disabled={isProcessing}
                                                className="w-full"
                                            />
                                        </div>
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
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
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
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                Page Numbers Added Successfully!
                                            </h3>
                                            <p className="text-gray-700">
                                                Your PDF has been updated with page numbers.
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
                                        Download PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Process Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🎨</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fully Customizable</h3>
                        <p className="text-gray-600 text-sm">
                            Choose position, font size, color, format, and margin offset for your page numbers.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                        <p className="text-gray-600 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 text-sm">
                            Web Worker technology ensures smooth processing without freezing your browser.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-indigo-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-violet-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Customize</h3>
                            <p className="text-sm text-gray-600">Choose position, format, size, and color</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-purple-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Process</h3>
                            <p className="text-sm text-gray-600">Click the button and page numbers are added</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                            <p className="text-sm text-gray-600">Get your numbered PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Where can I place page numbers?</h3>
                            <p className="text-gray-600 text-sm">
                                You can place page numbers at the bottom center, bottom left, bottom right, top center, top left, or top right of each page.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What formats are available?</h3>
                            <p className="text-gray-600 text-sm">
                                Choose from plain numbers (1, 2, 3), "Page 1" format, "1 of N" format, or "- 1 -" format. You can also set a custom starting number.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Your PDF never leaves your device. All processing happens locally in your browser, ensuring complete privacy and security.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I customize the appearance?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! You can customize the font size (8-36pt), color, and margin offset to get exactly the look you want.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 text-sm">
                                You can process PDFs up to 100MB. Processing time depends on the number of pages in your document.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our page numbering tool is completely free with unlimited usage. No sign-up, no hidden fees, no watermarks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
