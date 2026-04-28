import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import pdfToJpgExecutor from './executor';

export default function PDFToJPG() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
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
            const executionResult = await pdfToJpgExecutor.run({
                files: [file],
                options: {
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
        link.download = image.file?.name || `page_${index + 1}.jpg`;
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

                        {/* File Selected */}
                        {file && !results && (
                            <div>
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Range Options */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                        Select Pages to Convert
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="all"
                                                checked={pageRange === 'all'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">All Pages</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Convert every page to JPG</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="first"
                                                checked={pageRange === 'first'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">First Page Only</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">Convert only the first page</div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                                            <input
                                                type="radio"
                                                name="pageRange"
                                                value="custom"
                                                checked={pageRange === 'custom'}
                                                onChange={(e) => setPageRange(e.target.value)}
                                                className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white mb-2">Custom Pages</div>
                                                <input
                                                    type="text"
                                                    value={customPages}
                                                    onChange={(e) => setCustomPages(e.target.value)}
                                                    placeholder="e.g., 1,3-5,8"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    disabled={pageRange !== 'custom'}
                                                />
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Enter page numbers or ranges (e.g., 1,3-5,8)
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                        <p className="text-red-700 dark:text-red-300">{error}</p>
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
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                                Conversion Complete!
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Successfully converted {previewImages.length} {previewImages.length === 1 ? 'page' : 'pages'} to JPG
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Previews */}
                                <div className="mb-6 max-h-96 overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {previewImages.map((image, index) => (
                                            <div key={index} className="group relative">
                                                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    <img
                                                        src={image.url}
                                                        alt={`Page ${image.pageNumber}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        Page {image.pageNumber}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDownloadSingle(image, index)}
                                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 font-medium"
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
            </div>
        </div>
    );
}
