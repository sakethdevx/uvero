import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import Progress from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import videoToMp3Executor from './executor';

/**
 * Video to MP3 Converter Tool
 * Extracts audio from video files and converts to MP3
 * Supports offline (Web APIs) and online (server-side) processing
 */
export default function VideoToMP3({ mode = 'offline', isOnlineMode = mode === 'online' }) {
    const [file, setFile] = useState(null);
    const [bitrate, setBitrate] = useState(192);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [audioPreviewUrl, setAudioPreviewUrl] = useState('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        };
    }, [audioPreviewUrl, previewUrl]);

    // Create preview URL when file is selected
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    useEffect(() => {
        if (result?.primaryFile) {
            const url = URL.createObjectURL(result.primaryFile);
            setAudioPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [result]);

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
            const converted = await videoToMp3Executor.run({
                files: [file],
                options: { bitrate },
                mode,
                onProgress: setProgress,
            });
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

        const url = URL.createObjectURL(result.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.primaryFile.name;
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
        setBitrate(192);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setPreviewUrl('');
        setAudioPreviewUrl('');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="mx-auto max-w-5xl space-y-6">
            <div className="space-y-6">
                    {/* Upload Section */}
                    {!file && !result && (
                        <Dropzone
                            accept="video/*,.mp4,.mov,.avi,.webm,.mkv,.flv,.wmv"
                            onFileSelect={handleFileSelect}
                            maxSize={500 * 1024 * 1024} // 500MB limit
                        />
                    )}

                    {/* File Selected - Show Controls */}
                    {file && !result && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <FileInfo file={file} />

                            {/* Video Preview */}
                            {previewUrl && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Video Preview</h3>
                                    <div className="flex justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                        <video
                                            src={previewUrl}
                                            controls
                                            className="max-h-64 rounded shadow-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Bitrate Selector */}
                            <div className="card">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Audio Quality (Bitrate)
                                    </label>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {bitrate} kbps
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="64"
                                    max="320"
                                    step="32"
                                    value={bitrate}
                                    onChange={(e) => setBitrate(parseInt(e.target.value))}
                                    disabled={isProcessing}
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${((bitrate - 64) / (320 - 64)) * 100}%, #e5e7eb ${((bitrate - 64) / (320 - 64)) * 100}%, #e5e7eb 100%)`
                                    }}
                                />

                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    <span>64 kbps (Smaller)</span>
                                    <span>320 kbps (Better Quality)</span>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Recommended:</strong> 128 kbps for podcasts, 192 kbps for music, 320 kbps for high quality
                                    </p>
                                </div>
                            </div>

                            {/* Processing Progress */}
                            {isProcessing && (
                                <div className="card bg-primary-50 border-primary-200">
                                    <Progress progress={progress} label="Extracting audio and converting to MP3..." />
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30">
                                    <p className="text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    }
                                >
                                    Convert to MP3
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

                    {/* Result Display */}
                    {result && (
                        <div className="space-y-6">
                            {/* Success Message */}
                            <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                            Conversion Complete!
                                        </h3>
                                        <p className="text-green-700 dark:text-green-300">
                                            Your audio has been successfully extracted and converted to MP3.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* File Comparison */}
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Results</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Original Video</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(file.size)}</p>
                                    </div>
                                    <div className="p-4 bg-primary-50 rounded-lg">
                                        <p className="text-sm text-primary-600 mb-1">MP3 Audio</p>
                                        <p className="text-2xl font-bold text-primary-600">{formatFileSize(result.meta?.outputSize || result.primaryFile?.size || 0)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Bitrate:</strong> {bitrate} kbps | <strong>Duration:</strong> {result.meta?.duration || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Audio Player */}
                            {audioPreviewUrl && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview Audio</h3>
                                    <audio
                                        src={audioPreviewUrl}
                                        controls
                                        className="w-full"
                                    />
                                </div>
                            )}

                            {/* Download Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleDownload}
                                    fullWidth
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    }
                                >
                                    Download MP3
                                </Button>

                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                >
                                    Convert Another
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
        </div>
        </div>
    );
}
