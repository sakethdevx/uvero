import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const GIFMaker = () => {
    const [files, setFiles] = useState([]);
    const [inputType, setInputType] = useState('images'); // 'images' or 'video'
    const [frameDelay, setFrameDelay] = useState(500); // milliseconds
    const [quality, setQuality] = useState(10); // 1-30, lower = better
    const [width, setWidth] = useState(480);
    const [loop, setLoop] = useState(0); // 0 = infinite
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultGIF, setResultGIF] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (selectedFiles) => {
        const fileArray = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles];
        setFiles(fileArray);
        setResultGIF(null);
        setError('');
        setProgress(0);
    };

    const handleCreate = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const result = await processor.createGIF(
                files,
                inputType,
                {
                    frameDelay,
                    quality,
                    width,
                    loop
                },
                (prog) => setProgress(prog)
            );
            setResultGIF(result);
        } catch (err) {
            setError(err.message || 'GIF creation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!resultGIF) return;
        const a = document.createElement('a');
        a.href = resultGIF.url;
        a.download = resultGIF.filename;
        a.click();
    };

    const handleReset = () => {
        if (resultGIF?.url) {
            URL.revokeObjectURL(resultGIF.url);
        }
        setFiles([]);
        setResultGIF(null);
        setError('');
        setProgress(0);
        setIsProcessing(false);
    };

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        GIF Maker
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Create animated GIFs from images or videos
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {files.length === 0 ? (
                        <>
                            {/* Input Type Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    Create GIF from:
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setInputType('images')}
                                        className={`p-4 rounded-lg border-2 transition-all ${inputType === 'images'
                                                ? 'border-pink-500 bg-pink-50'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">🖼️</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">Multiple Images</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Upload 2+ images
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setInputType('video')}
                                        className={`p-4 rounded-lg border-2 transition-all ${inputType === 'video'
                                                ? 'border-pink-500 bg-pink-50'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">🎬</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">Video File</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Convert to GIF
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <Dropzone
                                onFileSelect={handleFileSelect}
                                accept={
                                    inputType === 'images'
                                        ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
                                        : 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
                                }
                                maxSize={inputType === 'images' ? 10 * 1024 * 1024 : 100 * 1024 * 1024}
                                multiple={inputType === 'images'}
                                label={
                                    inputType === 'images'
                                        ? 'Drop images here or click to browse'
                                        : 'Drop video here or click to browse'
                                }
                                description={
                                    inputType === 'images'
                                        ? 'Upload 2 or more images (JPG, PNG, WebP - Max 10MB each)'
                                        : 'Upload a video file (MP4, WebM, MOV - Max 100MB)'
                                }
                            />
                        </>
                    ) : (
                        <>
                            {/* File List */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {inputType === 'images' ? `${files.length} Image${files.length > 1 ? 's' : ''} Selected` : 'Video Selected'}
                                    </h3>
                                    <button
                                        onClick={handleReset}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="text-2xl">
                                                    {inputType === 'images' ? '🖼️' : '🎬'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                                        {file.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatBytes(file.size)}
                                                    </div>
                                                </div>
                                            </div>
                                            {inputType === 'images' && files.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="ml-2 text-red-600 hover:text-red-700"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!resultGIF && (
                                <>
                                    {/* Settings */}
                                    <div className="space-y-6 mb-6">
                                        {/* Frame Delay (for images) */}
                                        {inputType === 'images' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                    Frame Delay: {frameDelay}ms
                                                </label>
                                                <input
                                                    type="range"
                                                    min="100"
                                                    max="2000"
                                                    step="100"
                                                    value={frameDelay}
                                                    onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>Fast (100ms)</span>
                                                    <span>Slow (2000ms)</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quality */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Quality: {quality === 1 ? 'Best' : quality < 10 ? 'High' : quality < 20 ? 'Medium' : 'Low'}
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="30"
                                                value={quality}
                                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span>Best (Larger)</span>
                                                <span>Low (Smaller)</span>
                                            </div>
                                        </div>

                                        {/* Width */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Width: {width}px (Height: auto)
                                            </label>
                                            <input
                                                type="range"
                                                min="240"
                                                max="1080"
                                                step="120"
                                                value={width}
                                                onChange={(e) => setWidth(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span>240px</span>
                                                <span>480px</span>
                                                <span>720px</span>
                                                <span>1080px</span>
                                            </div>
                                        </div>

                                        {/* Loop */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                                Loop Animation
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => setLoop(0)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${loop === 0
                                                            ? 'border-pink-500 bg-pink-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">Infinite</div>
                                                </button>
                                                <button
                                                    onClick={() => setLoop(1)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${loop === 1
                                                            ? 'border-pink-500 bg-pink-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">Once</div>
                                                </button>
                                                <button
                                                    onClick={() => setLoop(3)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${loop === 3
                                                            ? 'border-pink-500 bg-pink-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">3 Times</div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Create Button */}
                                    <div className="mb-4">
                                        <Button
                                            onClick={handleCreate}
                                            disabled={isProcessing || (inputType === 'images' && files.length < 2)}
                                            className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                                        >
                                            {isProcessing ? 'Creating GIF...' : 'Create GIF'}
                                        </Button>
                                        {inputType === 'images' && files.length < 2 && (
                                            <p className="text-sm text-red-600 text-center mt-2">
                                                Please select at least 2 images
                                            </p>
                                        )}
                                    </div>

                                    {/* Progress */}
                                    {isProcessing && (
                                        <div className="mb-4">
                                            <ProgressBar progress={progress} />
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                                                {progress < 20
                                                    ? 'Preparing files...'
                                                    : progress < 80
                                                        ? 'Creating GIF...'
                                                        : 'Finalizing...'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-600 text-sm">{error}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Results */}
                            {resultGIF && (
                                <div className="mt-6">
                                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                ✅ GIF Created Successfully!
                                            </h3>
                                        </div>

                                        {/* GIF Preview */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Preview:</div>
                                            <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                                <img
                                                    src={resultGIF.url}
                                                    alt="Generated GIF"
                                                    className="max-w-full max-h-96 rounded-lg"
                                                />
                                            </div>
                                            <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Size: {formatBytes(resultGIF.size)}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleDownload}
                                                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                                            >
                                                Download GIF
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                variant="secondary"
                                                className="flex-1"
                                            >
                                                Create Another
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        About GIF Maker
                    </h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create GIFs From</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li><strong>Multiple Images:</strong> Combine 2+ images into an animated GIF</li>
                                <li><strong>Video Files:</strong> Convert MP4, WebM, MOV videos to GIF</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customization Options</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li><strong>Frame Delay:</strong> Control animation speed (images only)</li>
                                <li><strong>Quality:</strong> Balance between file size and visual quality</li>
                                <li><strong>Size:</strong> Set output width (240-1080px)</li>
                                <li><strong>Loop:</strong> Play once, 3 times, or infinitely</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Best Practices</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Keep GIFs under 5MB for fast loading</li>
                                <li>Use 480px width for social media</li>
                                <li>Lower quality settings for smaller files</li>
                                <li>Shorter videos (5-10 seconds) work best</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                How many images can I use?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                You can use as many images as needed (minimum 2). However, more images = larger GIF file size.
                                For best results, use 5-20 images.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                What's the best frame delay?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                500ms (half second) is good for most animations. Use 100-200ms for fast animations,
                                and 1000ms+ for slideshows.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                Why is my GIF so large?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                GIFs can be large! Reduce file size by: lowering quality setting, reducing width,
                                using fewer frames, or converting shorter video clips.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                Is processing done on my device?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Yes! All GIF creation happens in your browser. Your files never leave your device,
                                ensuring complete privacy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GIFMaker;