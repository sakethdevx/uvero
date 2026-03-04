import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';
import { useMode } from '../../../context/ModeContext';

/**
 * RAR to ZIP Converter
 * Convert RAR archives to ZIP format
 * Note: RAR extraction requires online processing
 */
export default function RARToZip() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const { isOnlineMode } = useMode();

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
    };

    const handleReset = () => {
        setFile(null);
        setError('');
    };

    const handleConvert = () => {
        if (!isOnlineMode) {
            setError('RAR extraction requires online mode. Please switch to online mode to convert RAR files.');
            return;
        }
        
        alert('Online conversion would be implemented here with server-side RAR extraction.');
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

                {!isOnlineMode && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">⚠️</div>
                            <div>
                                <h3 className="font-semibold text-yellow-900 mb-1">
                                    Online Mode Required
                                </h3>
                                <p className="text-sm text-yellow-700">
                                    RAR extraction requires server-side processing due to proprietary format. 
                                    Please switch to <strong>Online Mode</strong> to use this converter.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConvert}
                                disabled={!isOnlineMode}
                                variant="primary"
                                className="flex-1"
                            >
                                {isOnlineMode ? 'Convert to ZIP' : 'Online Mode Required'}
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
                            <strong>Why online mode?</strong> RAR uses a proprietary compression algorithm that requires 
                            server-side processing. Your files are processed securely and deleted immediately after conversion.
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
