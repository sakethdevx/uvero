import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Dropzone from './shared/Dropzone.jsx';
import Button from './shared/Button.jsx';
import ProgressBar from './shared/ProgressBar.jsx';
import FileInfo from './shared/FileInfo.jsx';
import unifiedProcessor from '../core/unifiedProcessor.js';

const SUPPORTED_CATEGORIES = {
    image: {
        title: 'Image Converter',
        description: 'Convert between 50+ image formats (JPG, PNG, WebP, AVIF, HEIC, TIFF, PSD, RAW, etc.)',
        icon: '🖼️',
        badge: 'WASM powered'
    },
    document: {
        title: 'Document Converter',
        description: 'Convert documents (DOCX, PDF, EPUB, HTML, Markdown, etc.) using Pandoc',
        icon: '📄',
        badge: 'Pandoc'
    }
};

export default function UnifiedConverter() {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState(null);
    const [outputFormats, setOutputFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [resultPreviewUrl, setResultPreviewUrl] = useState('');

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (resultPreviewUrl) URL.revokeObjectURL(resultPreviewUrl);
        };
    }, [previewUrl, resultPreviewUrl]);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }, [file]);

    useEffect(() => {
        if (result?.primaryFile) {
            const url = URL.createObjectURL(result.primaryFile);
            setResultPreviewUrl(url);
        }
    }, [result]);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
        setSelectedFormat(null);

        // Detect category and available outputs
        const cat = unifiedProcessor.detectCategory(selectedFile);
        setCategory(cat);
        if (cat) {
            setOutputFormats(unifiedProcessor.getSupportedOutputs(selectedFile));
        } else {
            setOutputFormats([]);
            setError('Unsupported file type. Please upload an image or document.');
        }
    };

    const handleConvert = async () => {
        if (!file || !selectedFormat) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);
        setResult(null);

        try {
            const res = await unifiedProcessor.convert(file, selectedFormat, (prog) => setProgress(prog));
            setResult(res);
        } catch (err) {
            setError(err.message || 'Conversion failed');
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
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
        setCategory(null);
        setOutputFormats([]);
        setSelectedFormat(null);
    };

    const categoryInfo = category ? SUPPORTED_CATEGORIES[category] : null;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Unified File Converter
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Convert images and documents using WebAssembly. Fast, private, client-side processing. No uploads.
                </p>

                <div className="space-y-6">
                    {/* Dropzone */}
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        accept={category === 'image' ? 'image/*' : '.doc,.docx,.pdf,.epub,.odt,.html,.md,.txt,.rst,.csv,.tsv,.json,.docbook'}
                        disabled={isProcessing}
                        value={file}
                    />

                    {file && categoryInfo && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Input Preview */}
                            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Original File
                                </h3>
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                    {category === 'image' && previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">{categoryInfo.icon}</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 break-words px-2">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <FileInfo file={file} className="mt-2" />
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Output Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {outputFormats.map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                type="button"
                                                onClick={() => setSelectedFormat(fmt.value)}
                                                disabled={isProcessing}
                                                className={`p-3 rounded-lg border text-left transition-colors ${
                                                    selectedFormat === fmt.value
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {fmt.label}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {fmt.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleConvert}
                                    disabled={!selectedFormat || isProcessing}
                                    loading={isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing ? 'Converting...' : 'Convert'}
                                </Button>

                                {isProcessing && (
                                    <ProgressBar progress={progress} label="Processing..." />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                                    ✓ Conversion Complete
                                </h3>
                                <div className="flex gap-2">
                                    <Button onClick={handleReset} variant="outline" size="sm">
                                        New Conversion
                                    </Button>
                                    <Button onClick={handleDownload} size="sm">
                                        Download
                                    </Button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                                    {category === 'image' && resultPreviewUrl ? (
                                        <img src={resultPreviewUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">📄</div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {result.primaryFile.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <FileInfo
                                        file={result.primaryFile}
                                        originalSize={result.items?.[0]?.originalSize}
                                    />
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Format: <span className="font-mono">{selectedFormat}</span>
                                        </p>
                                        {category === 'image' && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Quality: <span className="font-mono">92%</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
