import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import imageToPdfExecutor from './executor';

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
            const executionResult = await imageToPdfExecutor.run({
                files,
                options: { pageSize },
                mode: 'offline',
                onProgress: setProgress,
            });
            setResult(executionResult);
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

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'images.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

    const resultPageCount = result?.meta?.pageCount ?? files.length;
    const resultSize = result?.meta?.outputSize ?? result?.primaryFile?.size ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        {/* File Upload */}
                        {!result && (
                            <div className="space-y-6">
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${files.length === 0 ? 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-gray-50 dark:bg-gray-900' : 'border-green-300'
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
                                            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
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
                                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            {files.length === 0 ? 'Drop your images here' : `${files.length} image(s) selected`}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {files.length === 0 ? 'or click to browse' : 'Click to add more images'}
                                        </p>
                                    </div>
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                Selected Images ({files.length})
                                            </h3>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isProcessing || files.length >= 50}
                                                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:text-green-300 disabled:opacity-50"
                                            >
                                                + Add More
                                            </button>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto space-y-2">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                                >
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatFileSize(file.size)} • Page {index + 1}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleReorderFile(index, 'up')}
                                                            disabled={index === 0 || isProcessing}
                                                            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white disabled:opacity-30"
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => handleReorderFile(index, 'down')}
                                                            disabled={index === files.length - 1 || isProcessing}
                                                            className="p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white disabled:opacity-30"
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveFile(index)}
                                                            disabled={isProcessing}
                                                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 disabled:opacity-30"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Page Size Selector */}
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                                Page Size
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => setPageSize('fit')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'fit'
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Fit to Image</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Original size</div>
                                                </button>
                                                <button
                                                    onClick={() => setPageSize('a4')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'a4'
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">A4</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">210 × 297 mm</div>
                                                </button>
                                                <button
                                                    onClick={() => setPageSize('letter')}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border-2 transition-all ${pageSize === 'letter'
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Letter</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">8.5 × 11 in</div>
                                                </button>
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
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                PDF Created Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                Your PDF contains <span className="font-bold text-green-700 dark:text-green-300">{resultPageCount}</span> {resultPageCount === 1 ? 'page' : 'pages'}
                                            </p>
                                            <div className="bg-white dark:bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-100 inline-block">
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">File Size</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{formatFileSize(resultSize)}</div>
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
            </div>
        </div>
    );
}
