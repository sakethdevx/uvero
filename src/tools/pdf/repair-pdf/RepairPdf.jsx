import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

export default function RepairPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleRepair = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const repairResult = await processor.repair(
                file,
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                blob: repairResult.blob,
                pagesRecovered: repairResult.pagesRecovered,
                originalSize: repairResult.originalSize,
                repairedSize: repairResult.repairedSize,
                url: URL.createObjectURL(repairResult.blob)
            });

            setProgress(100);
        } catch (err) {
            console.error('Repair error:', err);
            setError(err.message || 'Failed to repair PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = `repaired_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
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
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔧</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            PDF Repair Tool
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Repair damaged or corrupt PDF files. Recover pages and data from broken PDFs.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>No Upload Required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Privacy First</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Unlimited Use</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tool Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* Dropzone */}
                        {!file && (
                            <Dropzone
                                onFileSelect={handleFileSelect}
                                accept=".pdf,application/pdf"
                                maxSize={100 * 1024 * 1024}
                                fileInputRef={fileInputRef}
                                icon="📄"
                                title="Drop damaged PDF here or click to browse"
                                subtitle="Maximum file size: 100MB"
                            />
                        )}

                        {/* File Info & Repair */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Info Box */}
                                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                                    <p className="text-sm text-gray-700">
                                        <strong>How it works:</strong> The repair tool attempts to load your PDF with permissive settings, then reconstructs a clean document by copying each recoverable page individually. Damaged pages that cannot be recovered will be skipped.
                                    </p>
                                </div>

                                {/* Progress */}
                                {isProcessing && (
                                    <ProgressBar progress={progress} />
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleRepair}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Repairing...' : 'Repair PDF'}
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

                        {/* Results */}
                        {result && (
                            <div className="space-y-6">
                                {/* Success Message */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                PDF Repaired Successfully!
                                            </h3>
                                            <p className="text-gray-700 mb-4">
                                                Recovered <span className="font-bold text-green-700">{result.pagesRecovered}</span> pages from your PDF.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 mb-1">Original Size</div>
                                                    <div className="font-semibold text-gray-900">{formatFileSize(result.originalSize)}</div>
                                                </div>
                                                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 mb-1">Repaired Size</div>
                                                    <div className="font-semibold text-green-700">{formatFileSize(result.repairedSize)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Repaired PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Repair Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                        <p className="text-gray-600 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔧</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Smart Recovery</h3>
                        <p className="text-gray-600 text-sm">
                            Individually recovers each page, skipping only truly unrecoverable content.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fast Processing</h3>
                        <p className="text-gray-600 text-sm">
                            Web Worker technology ensures smooth repair without freezing your browser.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-orange-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Drag & drop or click to select your damaged PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-red-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Analyze</h3>
                            <p className="text-sm text-gray-600">The tool scans the PDF structure for recoverable content</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-yellow-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Repair</h3>
                            <p className="text-sm text-gray-600">Recoverable pages are copied into a clean new PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                            <p className="text-sm text-gray-600">Get your repaired PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How does PDF repair work?</h3>
                            <p className="text-gray-600 text-sm">
                                Our tool loads your PDF with permissive settings that tolerate structural errors, then rebuilds a clean PDF by copying each recoverable page individually. This process can fix many common corruption issues.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What types of damage can be repaired?</h3>
                            <p className="text-gray-600 text-sm">
                                The tool can handle corrupted file structures, broken cross-references, incomplete downloads, and some encoding issues. Severely damaged files where no page data can be parsed may not be recoverable.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Your PDF never leaves your device. All repair processing happens locally in your browser, ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What if some pages can't be recovered?</h3>
                            <p className="text-gray-600 text-sm">
                                The tool will skip any pages that are too damaged to recover and include all recoverable pages in the output. The result summary shows how many pages were successfully recovered.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I repair password-protected PDFs?</h3>
                            <p className="text-gray-600 text-sm">
                                The tool attempts to load encrypted PDFs with permissive settings. Some password-protected files may be repairable, but results vary depending on the encryption method used.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our PDF repair tool is completely free with unlimited usage. No sign-up, no hidden fees, no watermarks on your repaired PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
