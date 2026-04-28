import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import archiveConverterExecutor from './executor';

/**
 * Archive Converter
 * Repackage and optimize ZIP archives locally
 */
export default function ArchiveConverter() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (selectedFile) => {
        const isZipFile = selectedFile && (
            selectedFile.name.toLowerCase().endsWith('.zip') ||
            selectedFile.type === 'application/zip'
        );

        if (!isZipFile) {
            setError('Archive Converter currently supports ZIP files only.');
            setFile(null);
            setResult(null);
            setProgress(0);
            return;
        }

        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const converted = await archiveConverterExecutor.run({
                files: [file],
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(converted);
            setProgress(100);
        } catch (err) {
            setError(err.message || 'Conversion failed. Please try again.');
            console.error('Conversion error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.primaryFile) return;

        const url = URL.createObjectURL(result.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.primaryFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">

                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">ℹ️</div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                ZIP-Only Processing
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Archive Converter currently repackages <strong>ZIP</strong> files locally in your browser. RAR support is not enabled until a real online archive implementation is added.
                            </p>
                        </div>
                    </div>
                </div>

                {!file && !result && (
                    <>
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".zip,application/zip"
                            maxSize={100}
                        />

                        {/* Features */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📦</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    ZIP Repackaging
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Rebuild ZIP archives with fresh compression locally
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🔒</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Private Processing
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Your ZIP files stay on your device during conversion
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Fast Conversion
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Quick archive processing and optimization
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {file && !result && (
                    <div className="space-y-4">
                        <FileInfo file={file} onRemove={() => setFile(null)} />

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-200 rounded-lg p-4">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="space-y-2">
                                <ProgressBar progress={progress} />
                                <p className="text-sm text-center text-gray-600 dark:text-gray-300">
                                    Converting archive... {progress}%
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConvert}
                                disabled={isProcessing}
                                variant="primary"
                                className="flex-1"
                            >
                                {isProcessing ? 'Converting...' : 'Convert Archive'}
                            </Button>
                            <Button
                                onClick={handleReset}
                                disabled={isProcessing}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">✅</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                        Conversion Complete!
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                        Your ZIP archive has been repackaged successfully.
                                    </p>
                                    <FileInfo file={result.primaryFile} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleDownload}
                                variant="primary"
                                className="flex-1"
                            >
                                Download Archive
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                            >
                                Convert Another
                            </Button>
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About Archive Converter</h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <p>
                            <strong>Supported Formats:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>ZIP</strong> - Universal format, repackaged locally in your browser</li>
                        </ul>
                        <p className="mt-4">
                            ZIP files can be repackaged and optimized entirely in your browser without uploading.
                            This keeps the current implementation simple and aligned with the offline executor model.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
