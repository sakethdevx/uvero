import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from '../audio-converter/processor';

const MP3Converter = () => {
    const [file, setFile] = useState(null);
    const [bitrate, setBitrate] = useState('192');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedAudio, setConvertedAudio] = useState(null);
    const [error, setError] = useState('');

    const bitrates = [
        { value: '64', label: '64 kbps' },
        { value: '128', label: '128 kbps' },
        { value: '192', label: '192 kbps (Recommended)' },
        { value: '256', label: '256 kbps' },
        { value: '320', label: '320 kbps (High Quality)' }
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
            const result = await processor.convert(
                file,
                'mp3',
                parseInt(bitrate),
                (progressValue) => setProgress(progressValue)
            );

            setConvertedAudio(result);
        } catch (err) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedAudio) return;

        const link = document.createElement('a');
        link.href = convertedAudio.url;
        link.download = convertedAudio.filename;
        link.click();
    };

    const handleReset = () => {
        setFile(null);
        setConvertedAudio(null);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        MP3 Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert any audio file to MP3 format with customizable bitrate
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="audio/*"
                            maxSize={100 * 1024 * 1024}
                            icon="🎵"
                            title="Drop audio file here or click to browse"
                            subtitle="Supports WAV, OGG, M4A, FLAC, and more"
                        />
                    ) : (
                        <div>
                            <FileInfo file={file} onRemove={handleReset} />

                            {/* Bitrate Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    MP3 Bitrate Quality
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {bitrates.map((br) => (
                                        <button
                                            key={br.value}
                                            onClick={() => setBitrate(br.value)}
                                            className={`py-3 px-4 rounded-lg font-medium transition-all ${
                                                bitrate === br.value
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-600'
                                            }`}
                                        >
                                            {br.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Higher bitrate = better quality but larger file size
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700">{error}</p>
                                </div>
                            )}

                            {isConverting && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Converting to MP3..." />
                                </div>
                            )}

                            {convertedAudio && (
                                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-900 mb-1">
                                                Conversion Complete!
                                            </p>
                                            <p className="text-sm text-green-700">
                                                {convertedAudio.filename} • {formatSize(convertedAudio.size)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {!convertedAudio ? (
                                    <>
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isConverting}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                        >
                                            {isConverting ? 'Converting...' : 'Convert to MP3'}
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
                                            Download MP3
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
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Universal Format</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            MP3 is supported by all devices and players
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Control</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Choose from multiple bitrate options for optimal quality
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens locally in your browser
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MP3Converter;
