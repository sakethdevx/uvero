import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import jpgToPdfExecutor from './executor';

export default function JPGToPDF() {
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
            const validTypes = ['image/jpeg', 'image/jpg'];
            return validTypes.includes(file.type) || file.name.match(/\.jpe?g$/i);
        });

        if (validFiles.length === 0) {
            setError('Please select valid JPG/JPEG files');
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
            const validTypes = ['image/jpeg', 'image/jpg'];
            return validTypes.includes(file.type) || file.name.match(/\.jpe?g$/i);
        });

        if (validFiles.length === 0) {
            setError('Please drop valid JPG/JPEG files');
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
            const executionResult = await jpgToPdfExecutor.run({
                files,
                options: { pageSize },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);
        } catch (err) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const resultPageCount = result?.meta?.pageCount ?? files.length;
    const resultSize = result?.meta?.outputSize ?? result?.primaryFile?.size ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {files.length === 0 ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Drop JPG files here or click to browse
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Support for multiple JPG/JPEG files
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,image/jpeg"
                                    onChange={handleFileSelect}
                                    multiple
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    Select JPG Files
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File List */}
                            <div className="mb-6 max-h-96 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{index + 1}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleReorderFile(index, 'up')}
                                                disabled={index === 0}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:text-blue-400 disabled:opacity-30"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleReorderFile(index, 'down')}
                                                disabled={index === files.length - 1}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:text-blue-400 disabled:opacity-30"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Page Size Options */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Page Size
                                </label>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'fit', label: 'Fit to Image' },
                                        { value: 'a4', label: 'A4' },
                                        { value: 'letter', label: 'Letter' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setPageSize(option.value)}
                                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                                                pageSize === option.value
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-600'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} />
                                </div>
                            )}

                            {/* Result */}
                            {result && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-green-900 dark:text-green-100">Conversion Complete!</p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {resultPageCount} {resultPageCount === 1 ? 'page' : 'pages'} • {formatFileSize(resultSize)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {!result ? (
                                    <>
                                        <Button
                                            onClick={handleConvert}
                                            disabled={isProcessing || files.length === 0}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        >
                                            {isProcessing ? 'Converting...' : 'Convert to PDF'}
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Clear All
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download PDF
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Convert More
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
}
