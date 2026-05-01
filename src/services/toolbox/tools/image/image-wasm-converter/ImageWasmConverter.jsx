import { useState, useEffect, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import imageWasmConverterExecutor from './executor';

const OUTPUT_FORMATS = [
    { value: 'jpg', label: 'JPG', desc: 'Photos, small files' },
    { value: 'png', label: 'PNG', desc: 'Lossless & transparency' },
    { value: 'webp', label: 'WebP', desc: 'Best compression' },
    { value: 'gif', label: 'GIF', desc: 'Animated images' },
    { value: 'tiff', label: 'TIFF', desc: 'High quality print' },
    { value: 'bmp', label: 'BMP', desc: 'Bitmap' },
    { value: 'ico', label: 'ICO', desc: 'Favicons' },
    { value: 'avif', label: 'AVIF', desc: 'Next-gen compression' },
    { value: 'jxl', label: 'JPEG XL', desc: 'Modern format' },
    { value: 'heic', label: 'HEIC/HEIF', desc: 'Apple photos' },
    { value: 'svg', label: 'SVG', desc: 'Vector (limited)' },
    { value: 'psd', label: 'PSD', desc: 'Photoshop' },
];

export default function ImageWasmConverter() {
    const [file, setFile] = useState(null);
    const [outputFormat, setOutputFormat] = useState('png');
    const [quality, setQuality] = useState(92);
    const [keepMetadata, setKeepMetadata] = useState(true);
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
        // Validate that the file is a readable image
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setFile(selectedFile);
                setResult(null);
                setError('');
                setProgress(0);
            };
            img.onerror = () => {
                setError('The selected file is not a valid image or is corrupted.');
            };
            img.src = e.target?.result;
        };
        reader.onerror = () => {
            setError('Failed to read the selected file.');
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const result = await imageWasmConverterExecutor.run({
                files: [file],
                options: {
                    outputFormat,
                    quality,
                    keepMetadata
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
                    Image WASM Converter
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Advanced image conversion with 50+ format support using ImageMagick WASM.
                </p>

                <div className="space-y-6">
                    {/* File Upload */}
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        accept="image/*"
                        disabled={isProcessing}
                        value={file}
                    />

                    {file && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Input Preview */}
                            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Original Image
                                </h3>
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                    <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
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
                                                {fmt.label} - {fmt.desc}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quality: {quality}%
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        disabled={isProcessing}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="keepMetadata"
                                        checked={keepMetadata}
                                        onChange={(e) => setKeepMetadata(e.target.checked)}
                                        disabled={isProcessing}
                                        className="rounded"
                                    />
                                    <label htmlFor="keepMetadata" className="text-sm text-gray-700 dark:text-gray-300">
                                        Keep metadata (EXIF, etc.)
                                    </label>
                                </div>

                                <Button
                                    onClick={handleConvert}
                                    disabled={isProcessing}
                                    loading={isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing ? 'Converting...' : 'Convert Image'}
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
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                                    <img src={resultPreviewUrl} alt="Result" className="max-w-full max-h-full object-contain" />
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Quality: <span className="font-mono">{quality}%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                            <p className="font-semibold">Conversion Failed</p>
                            <p className="text-sm mt-1">{error}</p>
                            <p className="text-xs mt-2 text-red-500 dark:text-red-500">
                                Tip: Try a different image format (JPG, PNG, WebP) or check if the file is corrupted.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
