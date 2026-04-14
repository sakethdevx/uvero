import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import pdfConverterExecutor from './executor';

export default function PDFConverter() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [outputFormat, setOutputFormat] = useState('png'); // png or jpg
    const [pageRange, setPageRange] = useState('all'); // all, first, custom
    const [customPages, setCustomPages] = useState('');
    const [previewImages, setPreviewImages] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        previewImages.forEach((image) => URL.revokeObjectURL(image.url));
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResults(null);
        setError(null);
        setProgress(0);
        setPreviewImages([]);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            previewImages.forEach((image) => URL.revokeObjectURL(image.url));
            const executionResult = await pdfConverterExecutor.run({
                files: [file],
                options: {
                    format: outputFormat,
                    pageRange,
                    customPages,
                },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            const outputFiles = executionResult.primaryFile
                ? [executionResult.primaryFile]
                : (executionResult.files || []);
            const previews = outputFiles.map((outputFile, index) => ({
                file: outputFile,
                url: URL.createObjectURL(outputFile),
                pageNumber: executionResult.meta?.items?.[index]?.pageNumber || index + 1,
                size: executionResult.meta?.items?.[index]?.outputSize || outputFile.size,
            }));
            setPreviewImages(previews);
            setResults(executionResult);

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
        link.download = image.file?.name || `page_${index + 1}.${outputFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        if (!results) return;
        previewImages.forEach((image, index) => {
            setTimeout(() => {
                handleDownloadSingle(image, index);
            }, index * 100);
        });
    };

    const handleReset = () => {
        previewImages.forEach((image) => URL.revokeObjectURL(image.url));
        setFile(null);
        setResults(null);
        setError(null);
        setProgress(0);
        setCustomPages('');
        setPreviewImages([]);
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
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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

                        {/* File Info & Conversion Settings */}
                        {file && !results && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Output Format Selector */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Output Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setOutputFormat('png')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${outputFormat === 'png'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">PNG</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Lossless quality</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Best for text & diagrams</div>
                                        </button>
                                        <button
                                            onClick={() => setOutputFormat('jpg')}
                                            disabled={isProcessing}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${outputFormat === 'jpg'
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">JPG</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">Smaller file size</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Best for photos</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Page Range Selector */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Pages to Convert
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="all"
                                                checked={pageRange === 'all'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-4 h-4 text-blue-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-200">All pages</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="first"
                                                checked={pageRange === 'first'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-4 h-4 text-blue-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-200">First page only</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="custom"
                                                checked={pageRange === 'custom'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-4 h-4 text-blue-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-200">Custom pages</span>
                                        </label>
                                        {pageRange === 'custom' && (
                                            <input
                                                type="text"
                                                value={customPages}
                                                onChange={(e) => setCustomPages(e.target.value)}
                                                placeholder="e.g., 1,3,5-7"
                                                disabled={isProcessing}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        )}
                                    </div>
                                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                                        <strong>Tip:</strong> For custom pages, use commas and ranges (e.g., "1,3,5-7" converts pages 1, 3, 5, 6, and 7)
                                    </div>
                                </div>

                                {/* Progress */}
                                {isProcessing && (
                                    <ProgressBar progress={progress} />
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Converting...' : 'Convert to Images'}
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
                        {results && (
                            <div className="space-y-6">
                                {/* Success Message */}
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Conversion Successful!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Generated <span className="font-bold text-green-700 dark:text-green-300">{previewImages.length}</span> {outputFormat.toUpperCase()} {previewImages.length === 1 ? 'image' : 'images'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Gallery */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Converted Images</h3>
                                        <Button
                                            onClick={handleDownloadAll}
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            Download All
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                        {previewImages.map((image, index) => (
                                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <img
                                                    src={image.url}
                                                    alt={`Page ${image.pageNumber}`}
                                                    className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-700"
                                                />
                                                <div className="p-3 flex items-center justify-between">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900 dark:text-white">Page {image.pageNumber}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(image.size)}</div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleDownloadSingle(image, index)}
                                                        variant="secondary"
                                                        className="text-sm"
                                                    >
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset Action */}
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Convert Another PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
