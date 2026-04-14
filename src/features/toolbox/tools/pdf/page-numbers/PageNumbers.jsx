import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import pageNumbersExecutor from './executor';

export default function PageNumbers() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [position, setPosition] = useState('bottom-center');
    const [startNumber, setStartNumber] = useState(1);
    const [fontSize, setFontSize] = useState(12);
    const [format, setFormat] = useState('plain');
    const [color, setColor] = useState('#000000');
    const [margin, setMargin] = useState(30);
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

    const handleProcess = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await pageNumbersExecutor.run({
                files: [file],
                options: { position, startNumber, fontSize, format, color, margin },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);

            setProgress(100);
        } catch (err) {
            console.error('Page numbering error:', err);
            setError(err.message || 'Failed to add page numbers. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.primaryFile) return;

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.primaryFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

    const positionOptions = [
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-right', label: 'Top Right' }
    ];

    const formatOptions = [
        { value: 'plain', label: '1, 2, 3...' },
        { value: 'page', label: 'Page 1, Page 2...' },
        { value: 'of', label: '1 of N, 2 of N...' },
        { value: 'dash', label: '- 1 -, - 2 -...' }
    ];

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
                                maxSize={100 * 1024 * 1024}
                                fileInputRef={fileInputRef}
                                icon="📄"
                                title="Drop PDF here or click to browse"
                                subtitle="Maximum file size: 100MB"
                            />
                        )}

                        {/* File Info & Options */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Page Number Options */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Page Number Settings
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Position */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Position</label>
                                            <select
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {positionOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Format */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Format</label>
                                            <select
                                                value={format}
                                                onChange={(e) => setFormat(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                {formatOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Starting Number */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Starting Number</label>
                                            <input
                                                type="number"
                                                value={startNumber}
                                                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                                                min={1}
                                                disabled={isProcessing}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>

                                        {/* Font Size */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Font Size: {fontSize}pt</label>
                                            <input
                                                type="range"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                min={8}
                                                max={36}
                                                disabled={isProcessing}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Color</label>
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        {/* Margin Offset */}
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Margin Offset: {margin}px</label>
                                            <input
                                                type="range"
                                                value={margin}
                                                onChange={(e) => setMargin(parseInt(e.target.value))}
                                                min={10}
                                                max={100}
                                                disabled={isProcessing}
                                                className="w-full"
                                            />
                                        </div>
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
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
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
                                <div className="bg-gradient-to-r from-green-50 dark:from-gray-900 to-emerald-50 border border-green-200 dark:border-green-800/30 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Page Numbers Added Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Your PDF has been updated with page numbers.
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
                                        Download PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Process Another
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
