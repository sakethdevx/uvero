import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from '../../pdf/pdf-converter/processor';

export default function PDFToJPG() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [pageRange, setPageRange] = useState('all'); // all, first, custom
    const [customPages, setCustomPages] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResults(null);
        setError(null);
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const images = await processor.convert(
                file,
                'jpg',
                pageRange,
                customPages,
                (progressValue) => setProgress(progressValue)
            );

            setResults({
                images,
                format: 'jpg',
                count: images.length
            });

            setProgress(100);
        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to convert PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadSingle = (image, index) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `page_${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        if (!results) return;
        results.images.forEach((image, index) => {
            setTimeout(() => {
                handleDownloadSingle(image, index);
            }, index * 100);
        });
    };

    const handleReset = () => {
        setFile(null);
        setResults(null);
        setError(null);
        setProgress(0);
        setCustomPages('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🖼️</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            PDF to JPG Converter
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Convert PDF pages to high-quality JPG images. Extract all pages or specific ones.
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
                                <span>High Quality JPG</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Page Selection</span>
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
                                maxSize={50 * 1024 * 1024}
                                fileInputRef={fileInputRef}
                                icon="📄"
                                title="Drop PDF here or click to browse"
                                subtitle="Maximum file size: 50MB"
                            />
                        )}

                        {/* File Selected */}
                        {file && !results && (
                            <div>
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Range Options */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Pages to Convert
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="all"
                                                checked={pageRange === 'all'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">All Pages</div>
                                                <div className="text-sm text-gray-500">Convert every page to JPG</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="first"
                                                checked={pageRange === 'first'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">First Page Only</div>
                                                <div className="text-sm text-gray-500">Convert only the first page</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="custom"
                                                checked={pageRange === 'custom'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600 mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 mb-2">Custom Pages</div>
                                                <input
                                                    type="text"
                                                    value={customPages}
                                                    onChange={(e) => setCustomPages(e.target.value)}
                                                    placeholder="e.g., 1,3-5,8"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={pageRange !== 'custom'}
                                                />
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Enter page numbers or ranges (e.g., 1,3-5,8)
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                        <p className="text-red-700">{error}</p>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="mb-6">
                                        <ProgressBar progress={progress} label="Converting PDF to JPG..." />
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to JPG'}
                                    </Button>
                                    <Button onClick={handleReset} variant="secondary">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {results && (
                            <div>
                                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-900 mb-1">
                                                Conversion Complete!
                                            </p>
                                            <p className="text-sm text-green-700">
                                                Successfully converted {results.count} {results.count === 1 ? 'page' : 'pages'} to JPG
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Previews */}
                                <div className="mb-6 max-h-96 overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {results.images.map((image, index) => (
                                            <div key={index} className="group relative">
                                                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={image.url}
                                                        alt={`Page ${index + 1}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">
                                                        Page {index + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDownloadSingle(image, index)}
                                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        onClick={handleDownloadAll}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        Download All JPGs
                                    </Button>
                                    <Button onClick={handleReset} variant="secondary">
                                        Convert Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">High Quality JPG</h3>
                        <p className="text-gray-600 text-sm">
                            Extract pages as high-quality JPG images with excellent compression
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Page Selection</h3>
                        <p className="text-gray-600 text-sm">
                            Convert all pages, first page only, or specific page ranges
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
                        <p className="text-gray-600 text-sm">
                            All conversion happens in your browser - files never leave your device
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
