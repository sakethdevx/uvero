import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from '../../image/gif-maker/processor';

const VideoToGIF = () => {
    const [file, setFile] = useState(null);
    const [frameDelay, setFrameDelay] = useState(100); // milliseconds
    const [quality, setQuality] = useState(10); // 1-30, lower = better
    const [width, setWidth] = useState(480);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultGIF, setResultGIF] = useState(null);
    const [error, setError] = useState('');

    const qualityPresets = [
        { value: 5, label: 'High Quality', size: 'Larger file' },
        { value: 10, label: 'Medium Quality', size: 'Balanced' },
        { value: 20, label: 'Low Quality', size: 'Smaller file' }
    ];

    const sizePresets = [
        { value: 320, label: 'Small (320px)' },
        { value: 480, label: 'Medium (480px)' },
        { value: 640, label: 'Large (640px)' }
    ];

    const handleFileSelect = (selectedFile) => {
        // Ensure it's a video file
        if (!selectedFile.type.startsWith('video/')) {
            setError('Please select a valid video file');
            return;
        }
        setFile(selectedFile);
        setResultGIF(null);
        setError('');
        setProgress(0);
    };

    const handleCreate = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const result = await processor.createGIF(
                [file],
                'video',
                {
                    frameDelay,
                    quality,
                    width,
                    loop: 0 // infinite loop
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
        setFile(null);
        setResultGIF(null);
        setError('');
        setProgress(0);
        setIsProcessing(false);
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
                        Video to GIF Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert your videos into animated GIFs
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="video/*"
                            maxSize={100 * 1024 * 1024}
                            icon="🎬"
                            title="Drop video file here or click to browse"
                            subtitle="Convert MP4, MOV, WebM, and more to GIF"
                        />
                    ) : (
                        <div>
                            <FileInfo file={file} onRemove={handleReset} />

                            {/* Quality Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    GIF Quality
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {qualityPresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => setQuality(preset.value)}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                quality === preset.value
                                                    ? 'border-pink-600 bg-pink-50'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{preset.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preset.size}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    GIF Width
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {sizePresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => setWidth(preset.value)}
                                            className={`py-3 px-4 rounded-lg font-medium transition-all ${
                                                width === preset.value
                                                    ? 'bg-pink-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-600'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frame Delay */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    Animation Speed (Frame Delay: {frameDelay}ms)
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="50"
                                    value={frameDelay}
                                    onChange={(e) => setFrameDelay(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Fast</span>
                                    <span>Slow</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700">{error}</p>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Creating GIF..." />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                        This may take a while depending on video length and quality settings
                                    </p>
                                </div>
                            )}

                            {resultGIF && (
                                <div className="mb-6">
                                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded mb-4">
                                        <p className="font-semibold text-green-900 mb-1">GIF Created Successfully!</p>
                                        <p className="text-sm text-green-700">
                                            {resultGIF.filename} • {formatBytes(resultGIF.size)}
                                        </p>
                                    </div>
                                    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-center">
                                        <img src={resultGIF.url} alt="Generated GIF" className="max-w-full rounded" />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {!resultGIF ? (
                                    <>
                                        <Button
                                            onClick={handleCreate}
                                            disabled={isProcessing}
                                            className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                                        >
                                            {isProcessing ? 'Creating GIF...' : 'Create GIF'}
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download GIF
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Convert Another
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Animated GIFs</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Create looping animated GIFs from your video files
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customizable</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Control quality, size, and animation speed
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens locally in your browser
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About Video to GIF Conversion</h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>
                            GIFs are perfect for sharing short video clips on social media, messaging apps, and websites.
                            They play automatically, loop infinitely, and don't require a video player.
                        </p>
                        <p>
                            Our Video to GIF converter lets you control the quality, size, and animation speed to create
                            the perfect GIF for your needs. Smaller sizes and lower quality settings result in smaller file
                            sizes, making them easier to share.
                        </p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <p className="text-sm text-yellow-800">
                                <strong>Tip:</strong> For best results, use short video clips (under 10 seconds).
                                Longer videos will result in larger GIF files.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoToGIF;
