import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import videoToGifExecutor from './executor';

const VideoToGIF = ({ mode = 'offline', isOnlineMode = mode === 'online' }) => {
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
            const result = await videoToGifExecutor.run({
                files: [file],
                mode,
                options: {
                    frameDelay,
                    quality,
                    width,
                    loop: 0,
                },
                onProgress: (prog) => setProgress(prog),
            });
            setResultGIF(result);
        } catch (err) {
            setError(err.message || 'GIF creation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!resultGIF?.primaryFile) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(resultGIF.primaryFile);
        a.download = resultGIF.primaryFile.name;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleReset = () => {
        if (resultGIF?.previewUrl) {
            URL.revokeObjectURL(resultGIF.previewUrl);
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
        <div className="mx-auto max-w-5xl space-y-6">
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
                                                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
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
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
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
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded mb-4">
                                        <p className="font-semibold text-green-900 dark:text-green-100 mb-1">GIF Created Successfully!</p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            {resultGIF.primaryFile.name} • {formatBytes(resultGIF.meta?.outputSize || resultGIF.primaryFile.size)}
                                        </p>
                                    </div>
                                    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-center">
                                        <img src={resultGIF.previewUrl} alt="Generated GIF" className="max-w-full rounded" />
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
        </div>
    );
};

export default VideoToGIF;
