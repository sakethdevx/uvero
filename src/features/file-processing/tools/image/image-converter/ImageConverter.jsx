import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import processor from './processor';

/**
 * Image Converter Tool
 * Converts images between formats and allows resizing
 */
export default function ImageConverter() {
    const [file, setFile] = useState(null);
    const [outputFormat, setOutputFormat] = useState('png');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            processor.terminate();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Create preview URL when file is selected
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const widthNum = width ? parseInt(width) : null;
            const heightNum = height ? parseInt(height) : null;

            const converted = await processor.convert(
                file,
                outputFormat,
                widthNum,
                heightNum,
                maintainAspectRatio,
                (prog) => setProgress(prog)
            );

            setProgress(100);
            setResult(converted);
        } catch (err) {
            setError(err.message || 'Conversion failed. Please try again.');
            console.error('Conversion error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
        setWidth('');
        setHeight('');
        setMaintainAspectRatio(true);
        setOutputFormat('png');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Image Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                        Convert images between JPG, PNG, and WebP formats. Resize images while maintaining quality.
                        All processing happens instantly in your browser.
                    </p>

                    {/* Privacy Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">
                            100% Private - Files never leave your device
                        </span>
                    </div>
                </div>

                {/* Main Tool Area */}
                <div className="space-y-6">
                    {/* Upload Section */}
                    {!file && !result && (
                        <Dropzone
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onFileSelect={handleFileSelect}
                            maxSize={50 * 1024 * 1024} // 50MB limit
                        />
                    )}

                    {/* File Selected - Show Controls */}
                    {file && !result && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <FileInfo file={file} />

                            {/* Preview */}
                            {previewUrl && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
                                    <div className="flex justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-64 rounded shadow-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Conversion Options */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Conversion Options
                                </h3>

                                {/* Output Format */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Output Format
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['jpg', 'png', 'webp'].map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => setOutputFormat(format)}
                                                disabled={isProcessing}
                                                className={`
                          px-4 py-3 rounded-lg font-semibold text-sm transition-all
                          ${outputFormat === format
                                                        ? 'bg-primary-600 text-white shadow-md'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-600'
                                                    }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                                            >
                                                {format.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resize Options */}
                                <div className="border-t pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Resize Image (Optional)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={maintainAspectRatio}
                                                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                                disabled={isProcessing}
                                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Maintain aspect ratio</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Width (px)</label>
                                            <input
                                                type="number"
                                                value={width}
                                                onChange={(e) => setWidth(e.target.value)}
                                                disabled={isProcessing}
                                                placeholder="Original"
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Height (px)</label>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                disabled={isProcessing}
                                                placeholder="Original"
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Leave empty to keep original dimensions
                                    </p>
                                </div>
                            </div>

                            {/* Processing Progress */}
                            {isProcessing && (
                                <div className="card bg-primary-50 border-primary-200">
                                    <ProgressBar progress={progress} label="Converting image..." />
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="card bg-red-50 border-red-200">
                                    <p className="text-red-600 font-medium">⚠️ {error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    loading={isProcessing}
                                    fullWidth
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                    }
                                >
                                    Convert Image
                                </Button>

                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Result Section */}
                    {result && (
                        <div className="space-y-6">
                            {/* Success Message */}
                            <div className="card bg-green-50 border-green-200">
                                <div className="flex items-center gap-3">
                                    <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-900">Conversion Complete!</h3>
                                        <p className="text-sm text-green-700">
                                            Your image has been converted to {result.format} format and is ready to download.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Results Display */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Results</h3>

                                <div className="space-y-4">
                                    {/* Format Change */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Format</span>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm font-semibold">
                                                {file.type.split('/')[1].toUpperCase()}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                            <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-semibold">
                                                {result.format}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dimensions */}
                                    {result.dimensions && (
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dimensions</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {result.dimensions.original.width} × {result.dimensions.original.height}
                                                </span>
                                                {(result.dimensions.original.width !== result.dimensions.converted.width ||
                                                    result.dimensions.original.height !== result.dimensions.converted.height) && (
                                                        <>
                                                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                            <span className="text-sm font-semibold text-primary-600">
                                                                {result.dimensions.converted.width} × {result.dimensions.converted.height}
                                                            </span>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    )}

                                    {/* File Size */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">File Size</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {(result.originalSize / 1024).toFixed(1)} KB
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {(result.convertedSize / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download Button */}
                            <Button
                                onClick={handleDownload}
                                fullWidth
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                }
                            >
                                Download Converted Image
                            </Button>

                            {/* Convert Another */}
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                                fullWidth
                            >
                                Convert Another Image
                            </Button>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 space-y-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid gap-6">
                        {[
                            {
                                q: "What image formats can I convert between?",
                                a: "You can convert between JPG/JPEG, PNG, and WebP formats. These are the most common web image formats and cover the majority of use cases."
                            },
                            {
                                q: "Will converting formats reduce image quality?",
                                a: "Converting from lossy to lossless (e.g., JPG to PNG) won't improve quality. Converting to JPG or WebP applies compression. We use high-quality settings (92% for JPG) to minimize quality loss."
                            },
                            {
                                q: "Can I resize images during conversion?",
                                a: "Yes! You can specify custom width and/or height. Enable 'Maintain aspect ratio' to automatically calculate the other dimension and prevent distortion."
                            },
                            {
                                q: "Which format should I choose?",
                                a: "JPG is best for photos with small file sizes. PNG is perfect for graphics, logos, and images needing transparency. WebP offers the best compression while maintaining quality, but has slightly less browser support."
                            },
                            {
                                q: "Are my images uploaded to a server?",
                                a: "No! All conversion happens entirely in your browser using Web Workers. Your images never leave your device, ensuring complete privacy and security."
                            },
                            {
                                q: "Is there a file size or quantity limit?",
                                a: "Individual images can be up to 50MB. The current version processes one image at a time. Batch processing will be available in the Pro version."
                            },
                            {
                                q: "Can I convert animated images or GIFs?",
                                a: "The current version converts the first frame of animated images. Full animation support for GIFs is planned for a future update."
                            },
                            {
                                q: "Does resizing affect image quality?",
                                a: "Resizing down (making smaller) typically maintains quality well. Resizing up (making larger) may reduce quality since we're creating pixels that didn't exist. For best results, resize down or keep original dimensions."
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="card hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Format Comparison */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">
                        📊 Format Comparison Guide
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">JPG/JPEG</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Best for photographs</p>
                            <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                <li>✅ Small file size</li>
                                <li>✅ Wide compatibility</li>
                                <li>❌ No transparency</li>
                                <li>⚠️ Lossy compression</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">PNG</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Best for graphics & logos</p>
                            <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                <li>✅ Transparency support</li>
                                <li>✅ Lossless quality</li>
                                <li>✅ Sharp text/lines</li>
                                <li>❌ Larger file size</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">WebP</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Best for modern web</p>
                            <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                <li>✅ Superior compression</li>
                                <li>✅ Transparency support</li>
                                <li>✅ Better than JPG/PNG</li>
                                <li>⚠️ Newer format</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
