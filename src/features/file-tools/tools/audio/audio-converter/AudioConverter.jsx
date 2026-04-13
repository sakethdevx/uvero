import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import audioConverterExecutor from './executor';

const AudioConverter = () => {
    const [file, setFile] = useState(null);
    const [format, setFormat] = useState('mp3');
    const [bitrate, setBitrate] = useState('192');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedAudio, setConvertedAudio] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const formats = [
        { value: 'mp3', label: 'MP3' },
        { value: 'wav', label: 'WAV' }
    ];

    const bitrates = [
        { value: '64', label: '64 kbps' },
        { value: '128', label: '128 kbps' },
        { value: '192', label: '192 kbps' },
        { value: '256', label: '256 kbps' },
        { value: '320', label: '320 kbps' }
    ];

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setConvertedAudio(null);
        setError('');
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsConverting(true);
        setError('');
        setProgress(0);

        try {
            const result = await audioConverterExecutor.run({
                files: [file],
                options: {
                    format,
                    bitrate: parseInt(bitrate, 10),
                },
                mode: 'offline',
                onProgress: setProgress,
            });
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const nextPreviewUrl = URL.createObjectURL(result.primaryFile);
            setPreviewUrl(nextPreviewUrl);
            setConvertedAudio(result);
        } catch (err) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedAudio) return;

        const url = URL.createObjectURL(convertedAudio.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = convertedAudio.primaryFile.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setConvertedAudio(null);
        setError('');
        setProgress(0);
        setPreviewUrl('');
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-gray-900 to-pink-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Audio Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert your audio files between MP3 and WAV formats
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept={{
                                'audio/mpeg': ['.mp3'],
                                'audio/wav': ['.wav'],
                                'audio/wave': ['.wav'],
                                'audio/webm': ['.webm'],
                                'audio/x-m4a': ['.m4a'],
                                'audio/aac': ['.aac'],
                                'audio/flac': ['.flac']
                            }}
                            maxSize={100 * 1024 * 1024}
                            label="Drop your audio file here or click to browse"
                            description="Supports MP3, WAV, WebM, M4A, AAC, FLAC (Max 100MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {/* Format Selection */}
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        Output Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {formats.map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                onClick={() => setFormat(fmt.value)}
                                                className={`py-3 px-4 rounded-lg border-2 transition-all ${format === fmt.value
                                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                                    }`}
                                                disabled={isConverting}
                                            >
                                                <div className="font-medium">{fmt.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bitrate Selection (only for MP3) */}
                                {format === 'mp3' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                            Bitrate (Quality)
                                        </label>
                                        <select
                                            value={bitrate}
                                            onChange={(e) => setBitrate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            disabled={isConverting}
                                        >
                                            {bitrates.map((br) => (
                                                <option key={br.value} value={br.value}>
                                                    {br.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Higher bitrate = better quality but larger file size
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Convert Button */}
                            {!convertedAudio && (
                                <div className="mt-6">
                                    <Button
                                        onClick={handleConvert}
                                        disabled={isConverting}
                                        fullWidth
                                    >
                                        {isConverting ? 'Converting...' : 'Convert Audio'}
                                    </Button>
                                </div>
                            )}

                            {/* Progress */}
                            {isConverting && (
                                <div className="mt-6">
                                    <ProgressBar progress={progress} />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                    <p className="text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            {/* Result */}
                            {convertedAudio && (
                                <div className="mt-6 space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-medium text-green-900 dark:text-green-100">
                                                    Conversion Complete!
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    {convertedAudio.primaryFile.name} • {formatSize(convertedAudio.meta?.outputSize || convertedAudio.primaryFile.size)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Audio Preview */}
                                        <div className="mb-3">
                                            <audio
                                                controls
                                                src={previewUrl}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Comparison */}
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Original</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatSize(file.size)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Converted</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatSize(convertedAudio.meta?.outputSize || convertedAudio.primaryFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button onClick={handleDownload} fullWidth>
                                            Download {format.toUpperCase()}
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary" fullWidth>
                                            Convert Another
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🎵</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multiple Formats</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Convert between MP3 and WAV audio formats easily
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">⚡</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Processing</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quick conversion with real-time progress tracking
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All conversions happen in your browser. Files never leave your device
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
                                What audio formats are supported?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                You can upload MP3, WAV, WebM, M4A, AAC, and FLAC files.
                                You can convert to MP3 or WAV format.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                What bitrate should I choose?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                For MP3: 128 kbps for decent quality, 192 kbps for good quality,
                                320 kbps for maximum quality. Higher bitrates result in larger files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Is WAV better than MP3?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                WAV is uncompressed and offers the highest quality but results in much
                                larger file sizes. MP3 is compressed and more suitable for sharing and streaming.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Are my files uploaded to a server?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No! All audio conversion happens directly in your browser using Web APIs.
                                Your files never leave your device, ensuring complete privacy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioConverter;
