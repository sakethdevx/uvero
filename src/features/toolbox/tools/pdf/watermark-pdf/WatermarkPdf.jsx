import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import watermarkPdfExecutor from './executor';

export default function WatermarkPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [watermarkType, setWatermarkType] = useState('text');
    const [text, setText] = useState('WATERMARK');
    const [fontSize, setFontSize] = useState(48);
    const [color, setColor] = useState('#ff0000');
    const [opacity, setOpacity] = useState(0.3);
    const [rotation, setRotation] = useState(-45);
    const [position, setPosition] = useState('center');
    const [watermarkImage, setWatermarkImage] = useState(null);
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

    const handleImageSelect = (e) => {
        const selected = e.target.files[0];
        if (selected && (selected.type === 'image/png' || selected.type === 'image/jpeg')) {
            setWatermarkImage(selected);
            setError(null);
        } else {
            setError('Please select a PNG or JPEG image');
        }
    };

    const handleApplyWatermark = async () => {
        if (!file) return;
        if (watermarkType === 'text' && !text.trim()) {
            setError('Please enter watermark text');
            return;
        }
        if (watermarkType === 'image' && !watermarkImage) {
            setError('Please select a watermark image');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const options = {
                type: watermarkType,
                text,
                fontSize,
                color,
                opacity,
                rotation,
                position,
            };

            if (watermarkType === 'image' && watermarkImage) {
                const imageBuffer = await watermarkImage.arrayBuffer();
                options.imageData = imageBuffer;
            }

            const executionResult = await watermarkPdfExecutor.run({
                files: [file],
                options,
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);

            setProgress(100);
        } catch (err) {
            console.error('Watermark error:', err);
            setError(err.message || 'Failed to add watermark. Please try again.');
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
        setWatermarkImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const positions = [
        { value: 'center', label: 'Center' },
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-right', label: 'Top Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'diagonal', label: 'Diagonal' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-900 via-white to-cyan-50">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">💧</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Watermark
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Add text or image watermarks to your PDF files. Fast, secure, and completely free.
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

                        {/* File Info & Watermark Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Watermark Settings */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    {/* Watermark Type Selector */}
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Watermark Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => setWatermarkType('text')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${watermarkType === 'text'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Text</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Add custom text watermark</div>
                                        </button>
                                        <button
                                            onClick={() => setWatermarkType('image')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${watermarkType === 'image'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">Image</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Add image as watermark</div>
                                        </button>
                                    </div>

                                    {/* Text Watermark Options */}
                                    {watermarkType === 'text' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Watermark Text</label>
                                                <input
                                                    type="text"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    disabled={isProcessing}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                    placeholder="Enter watermark text"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Font Size: {fontSize}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="120"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Color</label>
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => setColor(e.target.value)}
                                                        disabled={isProcessing}
                                                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer disabled:opacity-50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Opacity: {opacity}
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="1.0"
                                                        step="0.1"
                                                        value={opacity}
                                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                                        disabled={isProcessing}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Rotation: {rotation}°
                                                </label>
                                                <input
                                                    type="range"
                                                    min="-90"
                                                    max="90"
                                                    value={rotation}
                                                    onChange={(e) => setRotation(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Image Watermark Options */}
                                    {watermarkType === 'image' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Watermark Image</label>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg"
                                                    onChange={handleImageSelect}
                                                    disabled={isProcessing}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:bg-blue-900/20 file:text-blue-700 dark:text-blue-300 hover:file:bg-blue-100 dark:bg-blue-900/40 disabled:opacity-50"
                                                />
                                                {watermarkImage && (
                                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">✓ {watermarkImage.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Opacity: {opacity}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1.0"
                                                    step="0.1"
                                                    value={opacity}
                                                    onChange={(e) => setOpacity(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Position Selector */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Position</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {positions.map((pos) => (
                                                <button
                                                    key={pos.value}
                                                    onClick={() => setPosition(pos.value)}
                                                    disabled={isProcessing}
                                                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${position === pos.value
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {pos.label}
                                                </button>
                                            ))}
                                        </div>
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
                                        onClick={handleApplyWatermark}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
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
                                                Watermark Added Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Your PDF has been watermarked and is ready for download.
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
                                        Download Watermarked PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Watermark Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Web Worker technology ensures smooth watermarking without freezing your browser.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🎨</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fully Customizable</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Customize text, color, opacity, size, rotation, and position of your watermark.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-blue-600 dark:text-blue-400">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-cyan-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Configure</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose text or image watermark and customize settings</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-teal-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apply</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click apply and the watermark is added instantly</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your watermarked PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What types of watermarks can I add?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can add text watermarks with custom font size, color, opacity, and rotation, or image watermarks using PNG or JPEG files.
                                Both types support multiple position options.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I customize the watermark appearance?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! For text watermarks you can adjust the text content, font size (12-120px), color, opacity (10-100%),
                                rotation angle (-90° to 90°), and position. Image watermarks support opacity and position adjustments.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All watermarking happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What image formats are supported for watermarks?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Image watermarks support PNG and JPEG formats. PNG is recommended for watermarks with transparency.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will the watermark appear on every page?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes, the watermark is applied to every page of your PDF document at the same position and with the same settings.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF watermark tool is completely free with unlimited usage. No sign-up, no hidden fees,
                                and no limits on the number of PDFs you can watermark.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
