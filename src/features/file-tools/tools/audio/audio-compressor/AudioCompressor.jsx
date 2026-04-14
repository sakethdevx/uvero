import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import audioCompressorExecutor from './executor';

export default function AudioCompressor({ mode = 'offline', isOnlineMode = mode === 'online' }) {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [bitrate, setBitrate] = useState(128); // 64, 128, 192, 256, 320
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/ogg', 'audio/x-wav'];
        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|ogg)$/i)) {
            setError('Please select an audio file (MP3, WAV, or OGG)');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const compressed = await audioCompressorExecutor.run({
                files: [file],
                mode,
                options: { bitrate },
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(compressed);

            setProgress(100);
        } catch (err) {
            console.error('Compression error:', err);
            setError(err.message || 'Failed to compress audio. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.primaryFile) return;

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.primaryFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (result?.previewUrl) {
            URL.revokeObjectURL(result.previewUrl);
        }
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-gray-900 via-white to-pink-50 dark:to-gray-800">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🎵</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Audio Compressor
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Reduce audio file size while preserving quality. Convert to MP3 with customizable bitrate.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>{isOnlineMode ? 'Server-backed option' : '100% Client-side'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>{isOnlineMode ? 'Online processing ready' : 'No Upload Required'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>{isOnlineMode ? 'Flexible processing' : 'Privacy First'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>MP3 Output</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tool Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Dropzone */}
                        {!file && (
                            <Dropzone
                                onFileSelect={handleFileSelect}
                                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                                maxSize={50 * 1024 * 1024}
                                fileInputRef={fileInputRef}
                                icon="🎵"
                                title="Drop audio file here or click to browse"
                                subtitle="Supports MP3, WAV, OGG • Maximum 50MB"
                            />
                        )}

                        {/* File Info & Bitrate Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Bitrate Selector */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Output Bitrate (kbps)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {[64, 128, 192, 256, 320].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => setBitrate(rate)}
                                                disabled={isProcessing}
                                                className={`p-4 rounded-lg border-2 transition-all ${bitrate === rate
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white mb-1">{rate}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {rate === 64 && 'Small'}
                                                    {rate === 128 && 'Standard'}
                                                    {rate === 192 && 'High'}
                                                    {rate === 256 && 'Very High'}
                                                    {rate === 320 && 'Maximum'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                                        <strong>Tip:</strong> 128 kbps is ideal for most uses. Higher bitrates preserve more quality but increase file size.
                                    </div>
                                </div>

                                {/* Progress */}
                                {isProcessing && (
                                    <ProgressBar progress={progress} />
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCompress}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Compressing...' : 'Compress Audio'}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        disabled={isProcessing}
                                        variant="secondary"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="space-y-6">
                                {/* Success Message */}
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Audio Compressed Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                Your audio has been compressed by <span className="font-bold text-green-700 dark:text-green-300">{result.meta?.savings}%</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Original Size</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{formatFileSize(result.meta?.originalSize || 0)}</div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 dark:text-gray-300 mb-1">Compressed Size</div>
                                                    <div className="font-semibold text-green-700 dark:text-green-300">{formatFileSize(result.meta?.compressedSize || 0)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Audio Preview */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Preview Compressed Audio</h3>
                                    <audio
                                        controls
                                        className="w-full"
                                        src={result.previewUrl}
                                    />
                                </div>

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download MP3
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Compress Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {isOnlineMode
                                ? 'Online mode processes supported files on the server and returns compressed audio immediately.'
                                : 'Offline mode keeps compression in your browser so audio files never leave your device.'}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Processing</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Web Worker technology ensures smooth compression without freezing your browser.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Flexible Bitrates</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Choose from 5 bitrate options to balance file size and audio quality.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Which bitrate should I choose?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                <strong>64 kbps:</strong> Smallest files, suitable for voice recordings and podcasts.<br />
                                <strong>128 kbps:</strong> Standard quality, great for most music and general use.<br />
                                <strong>192 kbps:</strong> High quality, ideal for music with good detail.<br />
                                <strong>256 kbps:</strong> Very high quality, minimal quality loss.<br />
                                <strong>320 kbps:</strong> Maximum MP3 quality, near-lossless for most listeners.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What formats are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Input: MP3, WAV, OGG files up to 50MB. Output: MP3 format with your chosen bitrate.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my audio secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {isOnlineMode
                                    ? 'Yes. Online mode uploads the file only for the duration of server-side compression and returns the result immediately.'
                                    : 'Yes. Offline mode keeps your audio on-device and compresses it locally in the browser.'}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How much can I reduce file size?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Compression depends on your source file and chosen bitrate. Converting WAV to 128 kbps MP3
                                can reduce size by 85-90%. MP3 to MP3 compression varies based on original bitrate.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will compression affect audio quality?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                MP3 is a lossy format, so some quality reduction occurs. Higher bitrates (192+ kbps) preserve
                                excellent quality that most listeners can't distinguish from the original.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our audio compressor is completely free with unlimited usage. No sign-up, no hidden fees.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
