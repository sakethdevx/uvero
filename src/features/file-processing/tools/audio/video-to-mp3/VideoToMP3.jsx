import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import Progress from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { useMode } from '../../../context/ModeContext';
import processor from './processor';

/**
 * Video to MP3 Converter Tool
 * Extracts audio from video files and converts to MP3
 * Supports offline (Web APIs) and online (server-side) processing
 */
export default function VideoToMP3() {
    const { isOnlineMode } = useMode();
    const [file, setFile] = useState(null);
    const [bitrate, setBitrate] = useState(192);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
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
            let converted;

            if (isOnlineMode) {
                // Online mode: Upload to server for processing
                setProgress(10);
                converted = await processor.convertOnline(file, bitrate, (prog) => setProgress(prog));
            } else {
                // Offline mode: Client-side processing with Web APIs
                converted = await processor.convert(file, bitrate, (prog) => setProgress(prog));
            }

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
        setBitrate(192);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Video to MP3 Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                        Extract audio from video files and convert to MP3. Supports MP4, MOV, AVI, WebM, and more.
                        Choose your preferred bitrate for quality control.
                    </p>

                    {/* Mode Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Privacy Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-green-700">
                                100% Secure - All processing happens {isOnlineMode ? 'on our secure servers' : 'in your browser'}
                            </span>
                        </div>

                        {/* Current Mode Badge */}
                        {isOnlineMode ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span className="text-sm font-medium text-blue-700">
                                    Online Mode (Server Processing)
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Offline Mode (Client-Side)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Tool Area */}
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

                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
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
                            <div className="card bg-green-50 border-green-200">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                                            Conversion Complete!
                                        </h3>
                                        <p className="text-green-700">
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
                                        <p className="text-2xl font-bold text-primary-600">{formatFileSize(result.size)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        <strong>Bitrate:</strong> {bitrate} kbps | <strong>Duration:</strong> {result.duration || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Audio Player */}
                            {result.blob && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview Audio</h3>
                                    <audio
                                        src={URL.createObjectURL(result.blob)}
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

                {/* FAQ Section */}
                <div className="mt-16 card">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                What video formats are supported?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                We support all common video formats including MP4, MOV, AVI, WebM, MKV, FLV, and WMV.
                                The audio track will be extracted and converted to MP3.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                What bitrate should I choose?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                For speech/podcasts: 64-128 kbps is sufficient. For music: 192 kbps provides good quality.
                                For archival/high quality: use 320 kbps.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Is there a file size limit?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                In offline mode, limits depend on your device's memory. In online mode, the maximum file size is 500MB.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Are my videos stored anywhere?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No! In offline mode, everything happens in your browser. In online mode, videos are processed
                                and immediately deleted from our servers after conversion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
