import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import videoConverterExecutor from './executor';

const VideoConverter = ({ mode = 'offline', isOnlineMode = mode === 'online' }) => {
    const [file, setFile] = useState(null);
    const [outputFormat, setOutputFormat] = useState('mp4');
    const [quality, setQuality] = useState('high');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedVideo, setConvertedVideo] = useState(null);
    const [error, setError] = useState('');

    const formats = [
        { value: 'mp4', label: 'MP4', description: 'Best compatibility, works everywhere' },
        { value: 'webm', label: 'WebM', description: 'Web-optimized, good compression' },
        { value: 'avi', label: 'AVI', description: 'High quality, larger files' },
        { value: 'mov', label: 'MOV', description: 'Apple/QuickTime format' },
        { value: 'mkv', label: 'MKV', description: 'High quality, open format' }
    ];

    const qualities = [
        { value: 'low', label: 'Low', description: 'Smaller file, lower quality' },
        { value: 'medium', label: 'Medium', description: 'Balanced size and quality' },
        { value: 'high', label: 'High', description: 'Best quality, larger file' }
    ];

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setConvertedVideo(null);
        setError('');
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        setError('');
        setProgress(0);

        try {
            const result = await videoConverterExecutor.run({
                files: [file],
                mode,
                options: { outputFormat, quality },
                onProgress: (prog) => setProgress(prog),
            });
            setConvertedVideo(result);
        } catch (err) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedVideo?.primaryFile) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(convertedVideo.primaryFile);
        a.download = convertedVideo.primaryFile.name;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleReset = () => {
        if (convertedVideo?.previewUrl) {
            URL.revokeObjectURL(convertedVideo.previewUrl);
        }
        setFile(null);
        setConvertedVideo(null);
        setError('');
        setProgress(0);
        setIsConverting(false);
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
                            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.ogv,.mov,.avi,.mkv"
                            maxSize={500 * 1024 * 1024}
                            label="Drop your video file here or click to browse"
                            description="Supports MP4, WebM, AVI, MOV, MKV, OGG (Max 500MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {!convertedVideo && (
                                <>
                                    {/* Format Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Output Format
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                            {formats.map((format) => (
                                                <button
                                                    key={format.value}
                                                    onClick={() => setOutputFormat(format.value)}
                                                    className={`p-4 rounded-lg border-2 transition-all ${outputFormat === format.value
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {format.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {format.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quality Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Conversion Quality
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {qualities.map((qual) => (
                                                <button
                                                    key={qual.value}
                                                    onClick={() => setQuality(qual.value)}
                                                    className={`p-4 rounded-lg border-2 transition-all ${quality === qual.value
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {qual.label}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {qual.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Convert Button */}
                                    <div className="mt-6">
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isConverting}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                        >
                                            {isConverting ? 'Converting...' : 'Convert Video'}
                                        </Button>
                                    </div>

                                    {/* Progress */}
                                    {isConverting && (
                                        <div className="mt-6">
                                            <ProgressBar progress={progress} />
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                                                {progress < 15
                                                    ? 'Initializing FFmpeg...'
                                                    : progress < 90
                                                        ? 'Converting video...'
                                                        : 'Finalizing...'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Results */}
                            {convertedVideo && (
                                <div className="mt-6">
                                    <div className="bg-gradient-to-r from-purple-50 dark:from-gray-900 to-indigo-50 dark:to-gray-800 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                ✅ Conversion Complete!
                                            </h3>
                                        </div>

                                        {/* File Comparison */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Original</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {formatBytes(file.size)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {file.name.split('.').pop().toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Converted</div>
                                                <div className="font-semibold text-purple-600 dark:text-purple-400">
                                                    {formatBytes(convertedVideo.meta?.outputSize || convertedVideo.primaryFile.size)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {(convertedVideo.meta?.outputFormat || outputFormat).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Video Preview */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Preview:</div>
                                            <video
                                                src={convertedVideo.previewUrl}
                                                controls
                                                className="w-full max-h-96 rounded-lg bg-black"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleDownload}
                                                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                            >
                                                Download {outputFormat.toUpperCase()}
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                variant="secondary"
                                                className="flex-1"
                                            >
                                                Convert Another
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
        </div>
    );
};

export default VideoConverter;
