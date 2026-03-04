import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const VideoCompressor = () => {
    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState('medium');
    const [resolution, setResolution] = useState('original');
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [compressedVideo, setCompressedVideo] = useState(null);
    const [error, setError] = useState('');

    const qualityOptions = [
        { value: 'low', label: 'Low Quality', description: 'Smallest file size, lower quality', bitrate: '500k' },
        { value: 'medium', label: 'Medium Quality', description: 'Balanced size and quality', bitrate: '1000k' },
        { value: 'high', label: 'High Quality', description: 'Larger file, better quality', bitrate: '2000k' }
    ];

    const resolutionOptions = [
        { value: 'original', label: 'Original', description: 'Keep original resolution' },
        { value: '480p', label: '480p', description: '854×480 (SD)' },
        { value: '720p', label: '720p', description: '1280×720 (HD)' },
        { value: '1080p', label: '1080p', description: '1920×1080 (Full HD)' }
    ];

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setCompressedVideo(null);
        setError('');
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsCompressing(true);
        setError('');
        setProgress(0);

        try {
            const result = await processor.compress(
                file,
                quality,
                resolution,
                (progressValue) => setProgress(progressValue)
            );

            setCompressedVideo(result);
        } catch (err) {
            setError(err.message || 'Compression failed. Note: Video compression requires FFmpeg.wasm which may take time to load initially.');
        } finally {
            setIsCompressing(false);
        }
    };

    const handleDownload = () => {
        if (!compressedVideo) return;

        const link = document.createElement('a');
        link.href = compressedVideo.url;
        link.download = compressedVideo.filename;
        link.click();
    };

    const handleReset = () => {
        setFile(null);
        setCompressedVideo(null);
        setError('');
        setProgress(0);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const savedPercentage = compressedVideo
        ? Math.round((1 - compressedVideo.size / file.size) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Video Compressor
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Reduce video file size while maintaining quality
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogv,.mov"
                            maxSize={500 * 1024 * 1024}
                            label="Drop your video file here or click to browse"
                            description="Supports MP4, WebM, OGG, MOV (Max 500MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {!compressedVideo && (
                                <>
                                    {/* Quality Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Compression Quality
                                        </label>
                                        <div className="space-y-3">
                                            {qualityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setQuality(option.value)}
                                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${quality === option.value
                                                            ? 'border-green-600 bg-green-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                                        }`}
                                                    disabled={isCompressing}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        {option.label}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                                        {option.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resolution Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Output Resolution
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {resolutionOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setResolution(option.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${resolution === option.value
                                                            ? 'border-green-600 bg-green-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                                        }`}
                                                    disabled={isCompressing}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        {option.label}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-300">
                                                        {option.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Compress Button */}
                                    <div className="mt-6">
                                        <Button onClick={handleCompress} disabled={isCompressing} fullWidth>
                                            {isCompressing ? 'Compressing...' : 'Compress Video'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Progress */}
                            {isCompressing && (
                                <div className="mt-6">
                                    <ProgressBar progress={progress} />
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                                        This may take a while depending on video size...
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Result */}
                            {compressedVideo && (
                                <div className="mt-6 space-y-4">
                                    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="font-semibold text-green-900 text-lg mb-1">
                                                    Compression Complete!
                                                </p>
                                                <p className="text-sm text-green-700">
                                                    Saved {savedPercentage}% • {formatSize(file.size - compressedVideo.size)}
                                                </p>
                                            </div>
                                            <div className="text-4xl">✅</div>
                                        </div>

                                        {/* Video Preview */}
                                        <div className="mb-4 rounded-lg overflow-hidden bg-black">
                                            <video
                                                controls
                                                src={compressedVideo.url}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Size Comparison */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Original</p>
                                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                    {formatSize(file.size)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Compressed</p>
                                                <p className="font-semibold text-green-600 text-lg">
                                                    {formatSize(compressedVideo.size)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button onClick={handleDownload} fullWidth>
                                            Download Video
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary" fullWidth>
                                            Compress Another
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Important Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Note</h3>
                    <p className="text-sm text-yellow-800">
                        Video compression in the browser is experimental and uses FFmpeg.wasm.
                        First-time use may take longer as it loads necessary libraries (~30MB).
                        For large videos, consider using desktop software for better performance.
                    </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🎬</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Formats</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Support for MP4, WebM, OGG, and MOV video files
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">⚙️</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customizable</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Choose quality level and output resolution
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All compression happens in your browser
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                How much can I reduce the file size?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Typical compression saves 30-70% depending on the original video and settings chosen.
                                Higher quality settings preserve more detail but result in larger files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Why does the first compression take longer?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                The first time you use this tool, it needs to download FFmpeg.wasm (~30MB) which
                                enables video processing in the browser. Subsequent compressions will be faster.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                What's the maximum video size?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                The tool accepts videos up to 500MB. For larger videos, browser-based compression
                                may be slow or fail. Consider using desktop software for very large files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Are my videos uploaded to a server?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No! All video compression happens locally in your browser using FFmpeg.wasm.
                                Your videos never leave your device.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCompressor;
