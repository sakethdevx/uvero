import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import mp4ConverterExecutor from './executor';

const MP4Converter = () => {
    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState('high');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedVideo, setConvertedVideo] = useState(null);
    const [error, setError] = useState('');

    const qualities = [
        { value: 'low', label: 'Low Quality', description: 'Smaller file size, 720p' },
        { value: 'medium', label: 'Medium Quality', description: 'Balanced size and quality, 1080p' },
        { value: 'high', label: 'High Quality', description: 'Best quality, original resolution' }
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
            const result = await mp4ConverterExecutor.run({
                files: [file],
                mode: 'offline',
                options: { quality },
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-900 to-purple-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        MP4 Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert any video format to MP4 - the most compatible format
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="video/*"
                            maxSize={500 * 1024 * 1024}
                            icon="🎬"
                            title="Drop video file here or click to browse"
                            subtitle="Supports AVI, MOV, MKV, WebM, and more"
                        />
                    ) : (
                        <div>
                            <FileInfo file={file} onRemove={handleReset} />

                            {/* Quality Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    Output Quality
                                </label>
                                <div className="space-y-3">
                                    {qualities.map((q) => (
                                        <button
                                            key={q.value}
                                            onClick={() => setQuality(q.value)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                                quality === q.value
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{q.label}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{q.description}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    quality === q.value ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    {quality === q.value && (
                                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {isConverting && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Converting to MP4..." />
                                </div>
                            )}

                            {convertedVideo && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                                Conversion Complete!
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {convertedVideo.primaryFile.name} • {formatBytes(convertedVideo.meta?.outputSize || convertedVideo.primaryFile.size)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {!convertedVideo ? (
                                    <>
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isConverting}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            {isConverting ? 'Converting...' : 'Convert to MP4'}
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
                                            Download MP4
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
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Universal Format</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            MP4 works on all devices, players, and platforms
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Options</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Choose from low, medium, or high quality output
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why Convert to MP4?</h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>
                            MP4 (MPEG-4 Part 14) is the most widely supported video format in the world. It offers excellent
                            compression while maintaining high quality, making it perfect for sharing videos online, storing
                            on devices, and playing on any platform.
                        </p>
                        <p>
                            Whether you have AVI, MOV, MKV, WebM, or any other video format, converting to MP4 ensures
                            your videos will play everywhere - from smartphones and tablets to smart TVs and web browsers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MP4Converter;
