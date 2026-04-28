import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import backgroundRemoverExecutor from './executor';

const BackgroundRemover = () => {
    const [file, setFile] = useState(null);
    const [originalPreview, setOriginalPreview] = useState(null);
    const [quality, setQuality] = useState('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [resultPreviewUrl, setResultPreviewUrl] = useState(null);

    const handleFileSelect = (selectedFile) => {
        if (originalPreview) {
            URL.revokeObjectURL(originalPreview);
        }
        if (resultPreviewUrl) {
            URL.revokeObjectURL(resultPreviewUrl);
        }
        setFile(selectedFile);
        setOriginalPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setError('');
        setProgress(0);
        setResultPreviewUrl(null);
    };

    const handleRemoveBackground = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const processedImage = await backgroundRemoverExecutor.run({
                files: [file],
                options: { quality },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            if (resultPreviewUrl) {
                URL.revokeObjectURL(resultPreviewUrl);
            }
            const nextPreviewUrl = URL.createObjectURL(processedImage.primaryFile);
            setResultPreviewUrl(nextPreviewUrl);
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
        const url = URL.createObjectURL(result.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.primaryFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (originalPreview) {
            URL.revokeObjectURL(originalPreview);
        }
        if (resultPreviewUrl) {
            URL.revokeObjectURL(resultPreviewUrl);
        }
        setFile(null);
        setOriginalPreview(null);
        setResult(null);
        setResultPreviewUrl(null);
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
        <div className="mx-auto max-w-5xl space-y-6">
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
                                                    src={resultPreviewUrl}
                                                    alt="Result"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Size: {formatBytes(result.meta?.outputSize || result.primaryFile.size)} • PNG with transparency
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
