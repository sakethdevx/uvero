import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const BackgroundRemover = () => {
    const [file, setFile] = useState(null);
    const [originalPreview, setOriginalPreview] = useState(null);
    const [quality, setQuality] = useState('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setOriginalPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setError('');
        setProgress(0);
    };

    const handleRemoveBackground = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const processedImage = await processor.removeBackground(
                file,
                quality,
                (progressValue) => setProgress(progressValue)
            );

            setResult(processedImage);
            setProgress(100);
        } catch (err) {
            setError(err.message || 'Failed to remove background. Try with a different image.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.filename;
        a.click();
    };

    const handleReset = () => {
        if (originalPreview) {
            URL.revokeObjectURL(originalPreview);
        }
        if (result?.url) {
            URL.revokeObjectURL(result.url);
        }
        setFile(null);
        setOriginalPreview(null);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-gray-900 to-pink-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Background Remover
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Remove backgrounds from images automatically
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            maxSize={20 * 1024 * 1024}
                            label="Drop your image here or click to browse"
                            description="Supports JPG, PNG, WebP (Max 20MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {!result && (
                                <>
                                    {/* Settings */}
                                    <div className="mt-6 space-y-6">
                                        {/* Quality Setting */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                                Processing Quality
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setQuality('low')}
                                                    className={`p-4 rounded-lg border-2 transition-all ${quality === 'low'
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white">Fast</div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                        Quick processing, good for simple backgrounds
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setQuality('medium')}
                                                    className={`p-4 rounded-lg border-2 transition-all ${quality === 'medium'
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        High Quality
                                                        <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                                                            Recommended
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                        Best results, takes a bit longer
                                                    </div>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                💡 First use may take longer while loading the AI model
                                            </p>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Original Image</h3>
                                        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                            <img
                                                src={originalPreview}
                                                alt="Original"
                                                className="w-full h-auto max-h-[500px] object-contain mx-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className="mt-6">
                                        <Button
                                            onClick={handleRemoveBackground}
                                            disabled={isProcessing}
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            {isProcessing ? 'Removing Background...' : 'Remove Background with AI'}
                                        </Button>
                                    </div>

                                    {/* Progress */}
                                    {isProcessing && (
                                        <div className="mt-6">
                                            <ProgressBar progress={progress} />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Results */}
                            {result && (
                                <div className="mt-6 space-y-6">
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Background removed successfully!</span>
                                        </div>
                                    </div>

                                    {/* Before/After Comparison */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Original</h3>
                                            <div className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={originalPreview}
                                                    alt="Original"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Size: {formatBytes(file.size)}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Background Removed</h3>
                                            <div className="rounded-lg overflow-hidden border-2 border-purple-300 bg-checkered">
                                                <img
                                                    src={result.url}
                                                    alt="Result"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Size: {formatBytes(result.size)} • PNG with transparency
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            Download PNG
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            Process Another
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">Processing Failed</h4>
                                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Our AI-powered algorithm uses a machine learning model trained on millions of images to accurately detect and remove backgrounds. Works entirely in your browser - your images never leave your device.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Choose Your Quality</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    Select "Fast" for quick results with simple backgrounds, or "High Quality" for the best results with complex images. The first time may take longer as the AI model loads.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What image formats are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We support JPG, PNG, and WebP images up to 20MB in size. The output is always a transparent PNG file.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I get the best results?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                For best results, use images with clear subjects and good contrast. The "High Quality" mode works best for complex images with hair, fur, or intricate details. The AI model automatically detects subjects and removes backgrounds with high accuracy.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Why does it take longer the first time?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                The first time you use the tool, it needs to download and load the AI model (~5MB). After that, it's cached in your browser and subsequent uses will be much faster.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my data safe?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Yes! All processing happens locally in your browser. Your images never leave your device, ensuring complete privacy and security.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What can I use the transparent images for?</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Perfect for creating logos, product photos, profile pictures, stickers, or any design where you need a transparent background.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bg-checkered {
                    background-image: 
                        linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}</style>
        </div>
    );
};

export default BackgroundRemover;
