import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import mp4ConverterExecutor from './executor';

const MP4Converter = ({ mode = 'offline', isOnlineMode = mode === 'online' }) => {
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
        <div className="mx-auto max-w-5xl space-y-6">
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
        </div>
    );
};

export default MP4Converter;
