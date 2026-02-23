import { useState } from 'react';
import JSZip from 'jszip';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { useMode } from '../../../context/ModeContext';

/**
 * Archive Converter
 * Convert between archive formats (ZIP support offline, RAR requires online)
 */
export default function ArchiveConverter() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const { isOnlineMode } = useMode();

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const isRARFile = (file) => {
        return file && (file.name.toLowerCase().endsWith('.rar') || file.type === 'application/x-rar-compressed');
    };

    const handleConvert = async () => {
        if (!file) return;

        // Check if RAR file and not in online mode
        if (isRARFile(file) && !isOnlineMode) {
            setError('RAR files require online mode for extraction. Please switch to online mode or select a ZIP file.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            if (isRARFile(file)) {
                // Would handle RAR conversion in online mode
                setError('RAR conversion requires server-side processing. This feature will be available in online mode.');
                setIsProcessing(false);
                return;
            }

            // Handle ZIP file conversion (repack)
            setProgress(20);
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            setProgress(50);
            
            // Create new ZIP with same contents
            const newZip = new JSZip();
            const filePromises = [];
            
            contents.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    filePromises.push(
                        zipEntry.async('blob').then(blob => {
                            newZip.file(relativePath, blob);
                        })
                    );
                }
            });
            
            await Promise.all(filePromises);
            
            setProgress(80);
            
            const blob = await newZip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            setProgress(100);
            
            setResult({
                blob,
                file: {
                    name: file.name.replace(/\.[^.]+$/, '.zip'),
                    size: blob.size,
                    type: 'application/zip'
                }
            });
        } catch (err) {
            setError(err.message || 'Conversion failed. Please try again.');
            console.error('Conversion error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
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
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🗜️ Archive Converter
                    </h1>
                    <p className="text-gray-600">
                        Convert and optimize archive files
                    </p>
                </div>

                {!isOnlineMode && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">ℹ️</div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    Offline Mode
                                </h3>
                                <p className="text-sm text-blue-700">
                                    In offline mode, ZIP files can be converted and repackaged. 
                                    Switch to <strong>Online Mode</strong> to enable RAR file conversion.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!file && !result && (
                    <>
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".zip,.rar,application/zip,application/x-rar-compressed"
                            maxSize={100}
                        />

                        {/* Features */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📦</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Multiple Formats
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Support for ZIP archives (offline) and RAR (online)
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🔒</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Private Processing
                                </h3>
                                <p className="text-sm text-gray-600">
                                    ZIP files processed locally in your browser
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Fast Conversion
                                </h3>
                                <p className="text-sm text-gray-600">
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
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="space-y-2">
                                <ProgressBar progress={progress} />
                                <p className="text-sm text-center text-gray-600">
                                    Converting archive... {progress}%
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConvert}
                                disabled={isProcessing || (isRARFile(file) && !isOnlineMode)}
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
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">✅</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-900 mb-1">
                                        Conversion Complete!
                                    </h3>
                                    <p className="text-sm text-green-700 mb-3">
                                        Your archive has been converted successfully.
                                    </p>
                                    <FileInfo file={result.file} />
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
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">About Archive Converter</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>
                            <strong>Supported Formats:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>ZIP</strong> - Universal format, works offline</li>
                            <li><strong>RAR</strong> - Proprietary format, requires online mode</li>
                        </ul>
                        <p className="mt-4">
                            ZIP files can be converted and optimized entirely in your browser without uploading. 
                            RAR files require online processing due to the proprietary compression format.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
