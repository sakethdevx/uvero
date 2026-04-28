import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import mp4ToMp3Executor from './executor';

const MP4ToMP3 = ({ mode = 'offline', isOnlineMode = mode === 'online' }) => {
    const [file, setFile] = useState(null);
    const [bitrate, setBitrate] = useState('192');
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [convertedAudio, setConvertedAudio] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const bitrates = [
        { value: '128', label: '128 kbps' },
        { value: '192', label: '192 kbps (Recommended)' },
        { value: '256', label: '256 kbps' },
        { value: '320', label: '320 kbps (High Quality)' }
    ];

    const handleFileSelect = (selectedFile) => {
        // Check if it's an MP4 file
        if (!selectedFile.type.includes('mp4') && !selectedFile.name.endsWith('.mp4')) {
            setError('Please select a valid MP4 file');
            return;
        }
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
            const result = await mp4ToMp3Executor.run({
                files: [file],
                options: {
                    bitrate: parseInt(bitrate, 10),
                },
                mode,
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
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".mp4,video/mp4"
                            maxSize={200 * 1024 * 1024}
                            icon="🎬"
                            title="Drop MP4 file here or click to browse"
                            subtitle="Maximum file size: 200MB"
                        />
                    ) : (
                        <div>
                            <FileInfo file={file} onRemove={handleReset} />

                            {/* Bitrate Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                    MP3 Audio Quality
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {bitrates.map((br) => (
                                        <button
                                            key={br.value}
                                            onClick={() => setBitrate(br.value)}
                                            className={`py-3 px-4 rounded-lg font-medium transition-all ${bitrate === br.value
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-600'
                                                }`}
                                        >
                                            {br.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Higher bitrate = better audio quality but larger file size
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {isConverting && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Extracting audio and converting to MP3..." />
                                </div>
                            )}

                            {convertedAudio && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                                Conversion Complete!
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {convertedAudio.primaryFile.name} • {formatSize(convertedAudio.meta?.outputSize || convertedAudio.primaryFile.size)}
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
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                                        >
                                            {isConverting ? 'Converting...' : 'Extract to MP3'}
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
        </div>
    );
};

export default MP4ToMP3;
