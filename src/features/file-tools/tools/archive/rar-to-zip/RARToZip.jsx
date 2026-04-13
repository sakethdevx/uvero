import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';
import ProgressBar from '../../../shared/ProgressBar';
import rarToZipExecutor from './executor';

/**
 * RAR to ZIP Converter
 * Convert RAR archives to ZIP format
 * Wired for online RAR extraction
 */
export default function RARToZip() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
        setResult(null);
        setProgress(0);
    };

    const handleReset = () => {
        setFile(null);
        setError('');
        setResult(null);
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const conversionResult = await rarToZipExecutor.run({
                files: [file],
                mode: 'online',
                onProgress: (value) => setProgress(value),
            });
            setResult(conversionResult);
        } catch (err) {
            setError(err.message || 'RAR to ZIP conversion is not available right now.');
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🗜️ RAR to ZIP Converter
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Convert RAR archives to ZIP format
                    </p>
                </div>

                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">ℹ️</div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Online Extraction Enabled
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                This tool now uses the real online executor path. It supports single-volume, non-password-protected RAR archives and converts them to ZIP on the server.
                            </p>
                        </div>
                    </div>
                </div>

                {!file && (
                    <>
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".rar,application/x-rar-compressed"
                            maxSize={100}
                        />

                        {/* Features */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📦</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Universal Format
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    ZIP files work everywhere without special software
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🔓</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Extract & Repack
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Extracts RAR and repacks as ZIP
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Fast Processing
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Quick conversion with online processing
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {file && (
                    <div className="space-y-4">
                        <FileInfo file={file} onRemove={handleReset} />

                        {isProcessing && (
                            <ProgressBar progress={progress} />
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 rounded-lg p-4">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {result && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-200 rounded-lg p-4">
                                <p className="font-medium">Conversion complete</p>
                                <p className="text-sm">
                                    {result.primaryFile.name} • {result.meta?.extractedFiles || 0} extracted files
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {!result ? (
                                <>
                                    <Button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to ZIP'}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download ZIP
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Convert Another
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About RAR to ZIP Conversion</h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <p>
                            <strong>RAR</strong> is a proprietary archive format that requires special software to extract.
                        </p>
                        <p>
                            <strong>ZIP</strong> is a universal archive format supported by all operating systems without additional software.
                        </p>
                        <p className="mt-4">
                            <strong>Why online mode?</strong> RAR uses a proprietary compression format that is handled by a server-side extraction service before being repacked as ZIP.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            Note: Password-protected and multi-volume RAR archives are not supported in this first server-backed version.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
