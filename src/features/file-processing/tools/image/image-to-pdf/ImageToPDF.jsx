import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { processor } from './processor';

export default function ImageToPDF() {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [pageSize, setPageSize] = useState('fit'); // fit, a4, letter
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            setError('Please select valid image files (JPG, PNG, WebP)');
            return;
        }

        if (files.length + validFiles.length > 50) {
            setError('Maximum 50 images allowed');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        const validFiles = droppedFiles.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            setError('Please drop valid image files (JPG, PNG, WebP)');
            return;
        }

        if (files.length + validFiles.length > 50) {
            setError('Maximum 50 images allowed');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResult(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleReorderFile = (index, direction) => {
        const newFiles = [...files];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= files.length) return;

        [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
        setFiles(newFiles);
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const pdfBlob = await processor.convert(
                files,
                pageSize,
                (progressValue) => setProgress(progressValue)
            );

            const pdfFile = new File([pdfBlob], 'images.pdf', {
                type: 'application/pdf'
            });

            setResult({
                file: pdfFile,
                size: pdfBlob.size,
                url: URL.createObjectURL(pdfBlob),
                pageCount: files.length
            });

            setProgress(100);
        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to create PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = 'images.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFiles([]);
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">📄</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Image to PDF Converter
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Combine multiple images into a single PDF. Drag to reorder, choose page size, and download.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Multiple Images</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Custom Order</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Privacy First</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tool Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* File Upload */}
                        {!result && (
                            <div className="space-y-6">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${files.length === 0 ? 'border-gray-300 hover:border-green-400 hover:bg-gray-50' : 'border-green-300'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        multiple
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isProcessing}
                                    />
                                    <div className="pointer-events-none">
                                        <svg
                                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <p className="text-xl font-semibold text-gray-700 mb-2">
                                            {files.length === 0 ? 'Drop your images here' : `${files.length} image(s) selected`}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {files.length === 0 ? 'or click to browse' : 'Click to add more images'}
                                        </p>
                                    </div>
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Selected Images ({files.length})
                                            </h3>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isProcessing || files.length >= 50}
                                                className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                                            >
                                                + Add More
                                            </button>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto space-y-2">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200"
                                                >
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="w-16 h-16 object-cover rounded border border-gray-200"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(file.size)} • Page {index + 1}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleReorderFile(index, 'up')}
                                                            disabled={index === 0 || isProcessing}
                                                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => handleReorderFile(index, 'down')}
                                                            disabled={index === files.length - 1 || isProcessing}
                                                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            disabled={isProcessing}
                                                            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-30"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Page Size Selector */}
                                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                                Page Size
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => setPageSize('fit')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'fit'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1">Fit to Image</div>
                                                    <div className="text-xs text-gray-500">Original size</div>
                                                </button>
                                                <button
                                                    onClick={() => setPageSize('a4')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'a4'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1">A4</div>
                                                    <div className="text-xs text-gray-500">210 × 297 mm</div>
                                                </button>
                                                <button
                                                    onClick={() => setPageSize('letter')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'letter'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 mb-1">Letter</div>
                                                    <div className="text-xs text-gray-500">8.5 × 11 in</div>
                                                </button>
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
                                                onClick={handleConvert}
                                                disabled={isProcessing || files.length === 0}
                                                variant="primary"
                                                className="flex-1"
                                            >
                                                {isProcessing ? 'Creating PDF...' : `Create PDF (${files.length} ${files.length === 1 ? 'image' : 'images'})`}
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                disabled={isProcessing}
                                                variant="secondary"
                                            >
                                                Clear All
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
                                                PDF Created Successfully!
                                            </h3>
                                            <p className="text-gray-700 mb-4">
                                                Your PDF contains <span className="font-bold text-green-700">{result.pageCount}</span> {result.pageCount === 1 ? 'page' : 'pages'}
                                            </p>
                                            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100 inline-block">
                                                <div className="text-xs text-gray-600 mb-1">File Size</div>
                                                <div className="font-semibold text-gray-900">{formatFileSize(result.size)}</div>
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
                                        Download PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Create Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📱</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Multiple Images</h3>
                        <p className="text-gray-600 text-sm">
                            Combine up to 50 images into a single PDF document. Perfect for reports and presentations.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔄</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Reorder Pages</h3>
                        <p className="text-gray-600 text-sm">
                            Easily rearrange images before creating the PDF using simple up/down controls.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📏</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Custom Page Sizes</h3>
                        <p className="text-gray-600 text-sm">
                            Choose from fit-to-image, A4, or Letter page sizes for your PDF output.
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How many images can I add?</h3>
                            <p className="text-gray-600 text-sm">
                                You can combine up to 50 images in a single PDF. Each image should be under 10MB.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Which image formats are supported?</h3>
                            <p className="text-gray-600 text-sm">
                                JPG, PNG, and WebP image formats are supported. Most common image files will work.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What page size should I choose?</h3>
                            <p className="text-gray-600 text-sm">
                                <strong>Fit to Image:</strong> Each PDF page matches the image dimensions (best for mixed sizes).<br />
                                <strong>A4:</strong> Standard international paper size, great for printing.<br />
                                <strong>Letter:</strong> Standard US paper size (8.5" × 11").
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I reorder the images?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Use the up/down arrow buttons next to each image to change the page order before creating the PDF.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Absolutely! All processing happens locally in your browser. Your images never leave your device.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our image to PDF converter is completely free with unlimited usage. No sign-up required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
