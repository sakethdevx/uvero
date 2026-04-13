import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';
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

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
    };

    const handleReset = () => {
        setFile(null);
        setError('');
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');

        try {
            await rarToZipExecutor.run({
                files: [file],
                mode: 'online',
            });
        } catch (err) {
            setError(err.message || 'RAR to ZIP conversion is not available right now.');
        } finally {
            setIsProcessing(false);
        }
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

                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                Server Extractor Required
                            </h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                This tool is now wired for <strong>online mode</strong>, but it still needs a real server-side RAR extraction service to perform the conversion on this deployment.
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
                        <FileInfo file={file} onRemove={() => setFile(null)} />

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 rounded-lg p-4">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConvert}
                                disabled={isProcessing}
                                variant="primary"
                                className="flex-1"
                            >
                                {isProcessing ? 'Checking Service...' : 'Convert to ZIP'}
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
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
                            <strong>Why online mode?</strong> RAR uses a proprietary compression format that needs a server-side extraction service.
                            This page now uses the same executor-based architecture as the rest of the file tools and will surface a clear error until that backend service is configured.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            Note: For offline RAR extraction, consider using 7-Zip or WinRAR desktop applications.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
