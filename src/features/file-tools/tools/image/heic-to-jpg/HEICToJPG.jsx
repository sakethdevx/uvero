import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import heicToJpgExecutor from './executor';

export default function HEICToJPG({ mode = 'offline', isOnlineMode = mode === 'online' }) {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [quality, setQuality] = useState(0.92);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(file => {
            return file.name.match(/\.(heic|heif)$/i) || file.type === 'image/heic' || file.type === 'image/heif';
        });

        if (validFiles.length === 0) {
            setError('Please select valid HEIC/HEIF files');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResults([]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        const validFiles = droppedFiles.filter(file => {
            return file.name.match(/\.(heic|heif)$/i) || file.type === 'image/heic' || file.type === 'image/heif';
        });

        if (validFiles.length === 0) {
            setError('Please drop valid HEIC/HEIF files');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResults([]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const convertHEICToJPG = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setResults([]);

        try {
            const executionResult = await heicToJpgExecutor.run({
                files,
                options: { quality },
                mode,
                onProgress: setProgress,
            });
            const convertedFiles = executionResult.primaryFile
                ? [executionResult.primaryFile]
                : (executionResult.files || []);
            setProgress(100);
            setResults(convertedFiles);
        } catch (err) {
            console.error('HEIC conversion error:', err);
            setError(err.message || 'Conversion failed. Please ensure the files are valid HEIC/HEIF images.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadSingle = (resultFile) => {
        const url = URL.createObjectURL(resultFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        results.forEach((result, index) => {
            setTimeout(() => {
                handleDownloadSingle(result);
            }, index * 100);
        });
    };

    const handleReset = () => {
        setFiles([]);
        setResults([]);
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
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-gray-900 to-pink-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        HEIC to JPG Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert Apple HEIC/HEIF images to JPG/JPEG format with a clear offline and online path.
                    </p>
                    <p className="mt-3 text-sm font-medium text-purple-700 dark:text-purple-300">
                        Current mode: {isOnlineMode ? 'Online' : 'Offline'}
                    </p>
                </div>

                {/* Main Converter */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {files.length === 0 ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Drop HEIC files here or click to browse
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Support for HEIC/HEIF image files from Apple devices
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".heic,.heif,image/heic,image/heif"
                                    onChange={handleFileSelect}
                                    multiple
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                    Select HEIC Files
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File List */}
                            <div className="mb-6 max-h-96 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{index + 1}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Converting HEIC to JPG..." />
                                </div>
                            )}

                            {/* Results */}
                            {results.length > 0 && (
                                <div className="mb-6">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded mb-4">
                                        <p className="font-medium text-green-900 dark:text-green-100">Conversion Complete!</p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Successfully converted {results.length} {results.length === 1 ? 'file' : 'files'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {results.map((result, index) => (
                                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                                                    <span className="text-4xl">🖼️</span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">{result.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{formatFileSize(result.size)}</p>
                                                <button
                                                    onClick={() => handleDownloadSingle(result)}
                                                    className="w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quality Slider */}
                            {results.length === 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                        JPEG Quality: {Math.round(quality * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.05"
                                        value={quality}
                                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span>Smaller file</span>
                                        <span>Higher quality</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {results.length === 0 ? (
                                    <>
                                        <Button
                                            onClick={convertHEICToJPG}
                                            disabled={isProcessing || files.length === 0}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            {isProcessing ? 'Converting...' : 'Convert to JPG'}
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Clear All
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownloadAll}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download All
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Convert More
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
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apple Format</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Convert HEIC/HEIF images from iPhone and iPad to universal JPG format
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Batch Convert</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Convert multiple HEIC files to JPG at once
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
                                ? 'Online mode prefers client-side conversion first and only uses server rescue when the browser path cannot decode the file.'
                                : 'Offline mode keeps conversion fully in your browser so files stay on your device.'}
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About HEIC to JPG Conversion</h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>
                            HEIC (High Efficiency Image Container) is the default image format used by Apple devices since iOS 11.
                            While HEIC offers better compression and quality, it's not universally supported across all platforms.
                        </p>
                        <p>
                            Converting HEIC to JPG makes your images compatible with virtually all devices, browsers, and applications.
                            JPG is the most widely supported image format and works everywhere.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
