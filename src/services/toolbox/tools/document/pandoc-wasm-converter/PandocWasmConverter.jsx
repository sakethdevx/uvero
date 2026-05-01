import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import pandocWasmConverterExecutor from './executor';

const OUTPUT_FORMATS = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'html', label: 'HTML' },
    { value: 'epub', label: 'EPUB' },
    { value: 'odt', label: 'ODT' },
    { value: 'md', label: 'Markdown' },
    { value: 'rst', label: 'reStructuredText' },
    { value: 'rtf', label: 'RTF' },
    { value: 'docbook', label: 'DocBook' },
    { value: 'txt', label: 'Plain Text' },
];

export default function PandocWasmConverter() {
    const [file, setFile] = useState(null);
    const [outputFormat, setOutputFormat] = useState('pdf');
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
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const result = await pandocWasmConverterExecutor.run({
                files: [file],
                mode,
                options: {
                    outputFormat,
                },
                onProgress: (prog) => setProgress(prog),
            });
            setResult(result);
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
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Document Converter (Pandoc)
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Convert between various document and ebook formats using Pandoc WASM. Supports DOCX, PDF, EPUB, ODT, HTML, Markdown, and more.
                </p>

                <div className="space-y-6">
                    {/* File Upload */}
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        accept=".doc,.docx,.md,.markdown,.html,.csv,.tsv,.json,.epub,.odt,.txt,.rtf"
                        disabled={isProcessing}
                        value={file}
                    />

                    {file && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Input Preview */}
                            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Original Document
                                </h3>
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📄</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 break-words px-2">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <FileInfo file={file} className="mt-2" />
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Output Format
                                    </label>
                                    <select
                                        value={outputFormat}
                                        onChange={(e) => setOutputFormat(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        {OUTPUT_FORMATS.map((fmt) => (
                                            <option key={fmt.value} value={fmt.value}>
                                                {fmt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    loading={isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing ? 'Converting...' : 'Convert Document'}
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
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">📄</div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {result.primaryFile.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <FileInfo
                                        file={result.primaryFile}
                                        originalSize={result.items[0]?.originalSize}
                                    />
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Format: <span className="font-mono">{outputFormat}</span>
                                        </p>
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
