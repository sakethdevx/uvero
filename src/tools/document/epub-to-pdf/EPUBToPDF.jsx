import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import processor from './processor';

/**
 * EPUB to PDF Converter
 * Converts EPUB ebooks to PDF format
 */
export default function EPUBToPDF() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (result?.blob) {
                URL.revokeObjectURL(result.blob);
            }
        };
    }, [result]);

    const handleFileSelect = (selectedFile) => {
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
            const converted = await processor.convert(
                file,
                (prog) => setProgress(prog)
            );

            setProgress(100);
            setResult(converted);
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
                        📚 EPUB to PDF Converter
                    </h1>
                    <p className="text-gray-600">
                        Convert EPUB ebooks to PDF format
                    </p>
                </div>

                {!file && !result && (
                    <>
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".epub,application/epub+zip"
                            maxSize={50}
                        />

                        {/* Features */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📖</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Preserve Content
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Maintains text and formatting from your EPUB
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🔒</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    100% Private
                                </h3>
                                <p className="text-sm text-gray-600">
                                    All processing happens in your browser
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Fast Conversion
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Quick and efficient EPUB to PDF conversion
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
                                    Converting EPUB to PDF... {progress}%
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
                                {isProcessing ? 'Converting...' : 'Convert to PDF'}
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
                                        Your EPUB has been converted to PDF successfully.
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
                                Download PDF
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
                    <h3 className="font-semibold text-gray-900 mb-3">About EPUB to PDF Conversion</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p>
                            <strong>EPUB</strong> (Electronic Publication) is a popular ebook format that's widely used for digital books.
                        </p>
                        <p>
                            Converting EPUB to PDF makes your ebooks more universally accessible and easier to print or share.
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                            Note: Complex EPUB features like interactive elements or advanced formatting may be simplified in the PDF output.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
