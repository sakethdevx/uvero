import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import movToMp4Executor from './executor';

const MOVToMP4 = ({ mode = 'offline', isOnlineMode = mode === 'online' }) => {
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
        // Check if it's a MOV file
        if (!selectedFile.type.includes('quicktime') && !selectedFile.name.endsWith('.mov')) {
            setError('Please select a valid MOV file');
            return;
        }
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
            const result = await movToMp4Executor.run({
                files: [file],
                mode,
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
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        MOV to MP4 Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert Apple QuickTime MOV videos to universal MP4 format with {isOnlineMode ? 'server-backed' : 'on-device'} processing
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".mov,video/quicktime"
                            maxSize={500 * 1024 * 1024}
                            icon="🎥"
                            title="Drop MOV file here or click to browse"
                            subtitle="Convert QuickTime MOV videos to MP4"
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
                                                    ? 'border-cyan-600 bg-cyan-50'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{q.label}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{q.description}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    quality === q.value ? 'border-cyan-600' : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    {quality === q.value && (
                                                        <div className="w-3 h-3 rounded-full bg-cyan-600"></div>
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
                                    <ProgressBar progress={progress} label="Converting MOV to MP4..." />
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
                                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
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
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apple to Universal</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Convert Apple QuickTime MOV to universally compatible MP4
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Control</h3>
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
                            {isOnlineMode
                                ? 'Online mode uses secure server processing for supported MOV uploads.'
                                : 'Offline mode keeps conversion local in your browser.'}
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About MOV to MP4 Conversion</h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>
                            MOV is Apple's proprietary video format used by QuickTime. While it offers excellent quality,
                            it's not as widely supported as MP4, especially on non-Apple devices and platforms.
                        </p>
                        <p>
                            Converting MOV to MP4 makes your videos compatible with virtually all devices, video players,
                            and websites. MP4 is the standard format for video sharing on social media, video streaming
                            platforms, and professional video editing.
                        </p>
                        <p>
                            Both MOV and MP4 can use similar codecs, so converting between them often results in minimal
                            quality loss while gaining universal compatibility.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MOVToMP4;
