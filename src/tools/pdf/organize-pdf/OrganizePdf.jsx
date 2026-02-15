import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

export default function OrganizePdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [pages, setPages] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);

        try {
            const info = await processor.getPageInfo(selectedFile);
            setPages(Array.from({ length: info.totalPages }, (_, i) => i));
        } catch (err) {
            console.error('Error reading PDF:', err);
            setError('Failed to read PDF file. Please try again.');
            setFile(null);
        }
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newPages = [...pages];
        [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
        setPages(newPages);
    };

    const handleMoveDown = (index) => {
        if (index === pages.length - 1) return;
        const newPages = [...pages];
        [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
        setPages(newPages);
    };

    const handleRemovePage = (index) => {
        if (pages.length <= 1) {
            setError('Cannot remove the last page');
            return;
        }
        const newPages = [...pages];
        newPages.splice(index, 1);
        setPages(newPages);
    };

    const handleApply = async () => {
        if (!file || pages.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const blob = await processor.organize(
                file,
                pages,
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                url: URL.createObjectURL(blob),
                fileName: `organized_${file.name}`
            });

            setProgress(100);
        } catch (err) {
            console.error('Organize error:', err);
            setError(err.message || 'Failed to organize PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
        setPages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">📑</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Organize PDF Pages
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Reorder, delete, and rearrange pages in your PDF. Fast, secure, and completely free.
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
                                title="Drop PDF here or click to browse"
                                subtitle="Maximum file size: 100MB"
                            />
                        )}

                        {/* Page List & Controls */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Organizer */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Page Order
                                        </label>
                                        <span className="text-sm text-gray-500">{pages.length} pages</span>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto space-y-2">
                                        {pages.map((pageIndex, index) => (
                                            <div
                                                key={`${index}-${pageIndex}`}
                                                className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200"
                                            >
                                                <span className="text-sm font-medium text-gray-500 w-8 text-center">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <span className="text-sm text-gray-900">
                                                        📄 Original Page {pageIndex + 1}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                                                        title="Move up"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === pages.length - 1 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
                                                        title="Move down"
                                                    >
                                                        ▼
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemovePage(index)}
                                                        disabled={pages.length <= 1 || isProcessing}
                                                        className="p-1.5 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed text-red-500"
                                                        title="Remove page"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                        onClick={handleApply}
                                        disabled={isProcessing || pages.length === 0}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Processing...' : 'Apply Changes'}
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
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                PDF Organized Successfully!
                                            </h3>
                                            <p className="text-gray-700">
                                                Your PDF pages have been reorganized. The new PDF has {pages.length} pages.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Organized PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Organize Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔀</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Reorder Pages</h3>
                        <p className="text-gray-600 text-sm">
                            Move pages up or down to rearrange them in any order you need.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Delete Pages</h3>
                        <p className="text-gray-600 text-sm">
                            Remove unwanted pages from your PDF with a single click.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                        <p className="text-gray-600 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-teal-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-cyan-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Organize</h3>
                            <p className="text-sm text-gray-600">Reorder or remove pages as needed</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-emerald-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Apply</h3>
                            <p className="text-sm text-gray-600">Click Apply Changes to create the new PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                            <p className="text-sm text-gray-600">Get your reorganized PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How do I reorder pages?</h3>
                            <p className="text-gray-600 text-sm">
                                Use the up and down arrow buttons next to each page to move it to the desired position. The page list updates in real-time.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I delete pages from my PDF?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Click the remove button (✕) next to any page to delete it. You must keep at least one page in the document.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Your PDF never leaves your device. All processing happens locally in your browser, ensuring complete privacy and security.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 text-sm">
                                You can organize PDFs up to 100MB. Processing time depends on the number of pages and file size.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Will the PDF quality be affected?</h3>
                            <p className="text-gray-600 text-sm">
                                No, the quality of your PDF remains unchanged. We simply copy pages in the new order without any re-encoding or compression.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our PDF organizer is completely free with unlimited usage. No sign-up, no hidden fees, no watermarks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
