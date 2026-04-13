import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import scanToPdfExecutor from './executor';

export default function ScanToPdf() {
    const [images, setImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [pageSize, setPageSize] = useState('a4');
    const [orientation, setOrientation] = useState('auto');
    const [margin, setMargin] = useState('small');
    const [quality, setQuality] = useState(85);
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        setImages(prev => {
            if (prev.length >= 50) {
                setError('Maximum 50 images allowed');
                return prev;
            }
            setError('');
            const url = URL.createObjectURL(selectedFile);
            return [...prev, { id: Date.now() + Math.random(), file: selectedFile, preview: url }];
        });
        setResult(null);
    };

    const handleRemoveImage = (id) => {
        setImages(prev => {
            const item = prev.find(img => img.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter(img => img.id !== id);
        });
        setResult(null);
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newImages = [...images];
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        setImages(newImages);
    };

    const handleMoveDown = (index) => {
        if (index === images.length - 1) return;
        const newImages = [...images];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        setImages(newImages);
    };

    const handleConvert = async () => {
        if (images.length === 0) {
            setError('Please add at least one image');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const executionResult = await scanToPdfExecutor.run({
                files: images.map((img) => img.file),
                options: { pageSize, orientation, margin, quality },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });

            setResult(executionResult);
            setProgress(100);
        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to convert images to PDF. Please try again.');
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
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        setResult(null);
        setError('');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">📷</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Scan to PDF
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Convert scanned images and photos to PDF. Capture documents with your camera and create professional PDFs.
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
                        {!result ? (
                            <>
                                {/* Image List */}
                                {images.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Scanned Images ({images.length}/50)
                                            </h3>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                Total: {formatSize(totalSize)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {images.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                                >
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                                                        {index + 1}.
                                                    </span>
                                                    <img
                                                        src={item.preview}
                                                        alt={item.file.name}
                                                        className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                                            {item.file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                                            {formatSize(item.file.size)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleMoveUp(index)}
                                                            disabled={index === 0 || isProcessing}
                                                            className="p-2 hover:bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move up"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveDown(index)}
                                                            disabled={index === images.length - 1 || isProcessing}
                                                            className="p-2 hover:bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move down"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveImage(item.id)}
                                                            disabled={isProcessing}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded disabled:opacity-30"
                                                            title="Remove"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Dropzone */}
                                {images.length < 50 && (
                                    <Dropzone
                                        onFileSelect={handleFileSelect}
                                        accept="image/*,.jpg,.jpeg,.png,.bmp,.webp"
                                        maxSize={50 * 1024 * 1024}
                                        multiple={true}
                                        label={images.length === 0 ? "Drop scanned images here or click to browse" : "Add more images"}
                                        description={`JPG, PNG, BMP, WEBP (Max 50MB per file, ${50 - images.length} slots remaining)`}
                                    />
                                )}

                                {/* Options */}
                                {images.length > 0 && (
                                    <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                            Conversion Options
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Page Size */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Page Size</label>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(e.target.value)}
                                                    disabled={isProcessing}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="a4">A4</option>
                                                    <option value="letter">Letter</option>
                                                    <option value="legal">Legal</option>
                                                    <option value="auto">Auto (fit to image)</option>
                                                </select>
                                            </div>

                                            {/* Orientation */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Orientation</label>
                                                <select
                                                    value={orientation}
                                                    onChange={(e) => setOrientation(e.target.value)}
                                                    disabled={isProcessing || pageSize === 'auto'}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="auto">Auto</option>
                                                    <option value="portrait">Portrait</option>
                                                    <option value="landscape">Landscape</option>
                                                </select>
                                            </div>

                                            {/* Margin */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Margin</label>
                                                <select
                                                    value={margin}
                                                    onChange={(e) => setMargin(e.target.value)}
                                                    disabled={isProcessing}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="none">None</option>
                                                    <option value="small">Small (20pt)</option>
                                                    <option value="medium">Medium (40pt)</option>
                                                    <option value="large">Large (60pt)</option>
                                                </select>
                                            </div>

                                            {/* Image Quality */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                    Image Quality: {quality}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="100"
                                                    value={quality}
                                                    onChange={(e) => setQuality(Number(e.target.value))}
                                                    disabled={isProcessing}
                                                    className="w-full disabled:opacity-50"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>50%</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress */}
                                {isProcessing && (
                                    <div className="mt-6">
                                        <ProgressBar progress={progress} />
                                        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                                            Converting images to PDF...
                                        </p>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                {images.length > 0 && !isProcessing && (
                                    <div className="mt-6 flex gap-3">
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isProcessing}
                                            variant="primary"
                                            className="flex-1"
                                        >
                                            Convert to PDF
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            disabled={isProcessing}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Results */
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                PDF Created Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                Your scanned images have been converted to a <span className="font-bold text-green-700 dark:text-green-300">{result.meta?.totalPages}-page</span> PDF.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Total Pages</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{result.meta?.totalPages}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">File Size</div>
                                                    <div className="font-semibold text-green-700 dark:text-green-300">{formatSize(result.meta?.outputSize || result.primaryFile.size)}</div>
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
                                        Download PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Convert More
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📱</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mobile Camera Ready</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Take photos of documents with your phone camera and instantly convert them to PDF.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your images never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Conversion</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Web Worker technology ensures smooth conversion without freezing your browser.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-emerald-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scan or Upload</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Take photos with your mobile camera or upload scanned images</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-teal-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Arrange Pages</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Reorder your scanned images to get the pages in the right order</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Set Options</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose page size, orientation, margins, and image quality</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-cyan-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your professional PDF document instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I use my phone camera to scan documents?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Simply take photos of your documents with your mobile phone camera and upload them here.
                                The tool works great with camera photos and will convert them into a clean PDF document.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What image formats are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                We support JPG, JPEG, PNG, BMP, and WEBP image formats. These cover all common camera
                                and scanner output formats.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I reorder the pages?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Use the up (↑) and down (↓) arrow buttons next to each image to reorder them.
                                The order you set will be the page order in the final PDF.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What page size should I choose?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                <strong>A4:</strong> Standard international paper size (210 × 297 mm).<br />
                                <strong>Letter:</strong> US standard paper size (8.5 × 11 inches).<br />
                                <strong>Legal:</strong> US legal paper size (8.5 × 14 inches).<br />
                                <strong>Auto:</strong> Fits the page size to the image dimensions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Are my images secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Absolutely! All processing happens locally in your browser. Your images never leave your device,
                                ensuring complete privacy and security. We don&apos;t upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How many images can I convert at once?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can convert up to 50 images into a single PDF document. Each image can be up to 50MB in size.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our Scan to PDF tool is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
