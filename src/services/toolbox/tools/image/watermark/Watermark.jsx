import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import watermarkExecutor from './executor';

const Watermark = () => {
    const [file, setFile] = useState(null);
    const [watermarkType, setWatermarkType] = useState('text'); // 'text' or 'image'
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [text, setText] = useState('© Your Company');
    const [fontSize, setFontSize] = useState(48);
    const [opacity, setOpacity] = useState(0.5);
    const [position, setPosition] = useState('bottom-right');
    const [color, setColor] = useState('#ffffff');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);

    const positions = [
        { value: 'top-left', label: 'Top Left', icon: '↖️' },
        { value: 'top-center', label: 'Top Center', icon: '⬆️' },
        { value: 'top-right', label: 'Top Right', icon: '↗️' },
        { value: 'center-left', label: 'Center Left', icon: '⬅️' },
        { value: 'center', label: 'Center', icon: '⏺️' },
        { value: 'center-right', label: 'Center Right', icon: '➡️' },
        { value: 'bottom-left', label: 'Bottom Left', icon: '↙️' },
        { value: 'bottom-center', label: 'Bottom Center', icon: '⬇️' },
        { value: 'bottom-right', label: 'Bottom Right', icon: '↘️' }
    ];

    const handleFileSelect = (selectedFile) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(selectedFile);
        setResultImage(null);
        setError('');
        setProgress(0);
        setPreviewUrl(null);
    };

    const handleWatermarkImageSelect = (selectedFile) => {
        setWatermarkImage(selectedFile);
    };

    const handleApply = async () => {
        if (!file) return;
        if (watermarkType === 'text' && !text.trim()) {
            setError('Please enter watermark text');
            return;
        }
        if (watermarkType === 'image' && !watermarkImage) {
            setError('Please select a watermark image');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const result = await watermarkExecutor.run({
                files: [file],
                options: {
                    type: watermarkType,
                    text,
                    fontSize,
                    opacity,
                    position,
                    color,
                    watermarkImage
                },
                mode,
                onProgress: (prog) => setProgress(prog),
            });
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const nextPreviewUrl = URL.createObjectURL(result.primaryFile);
            setPreviewUrl(nextPreviewUrl);
            setResultImage(result);
        } catch (err) {
            setError(err.message || 'Failed to add watermark');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const url = URL.createObjectURL(resultImage.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = resultImage.primaryFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setWatermarkImage(null);
        setResultImage(null);
        setPreviewUrl(null);
        setError('');
        setProgress(0);
        setIsProcessing(false);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            maxSize={20 * 1024 * 1024}
                            label="Drop your image here or click to browse"
                            description="Supports JPG, PNG, WebP (Max 20MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {!resultImage && (
                                <>
                                    {/* Watermark Type */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Watermark Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setWatermarkType('text')}
                                                className={`p-4 rounded-lg border-2 transition-all ${watermarkType === 'text'
                                                        ? 'border-cyan-500 bg-cyan-50'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">📝</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">Text Watermark</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Add custom text
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setWatermarkType('image')}
                                                className={`p-4 rounded-lg border-2 transition-all ${watermarkType === 'image'
                                                        ? 'border-cyan-500 bg-cyan-50'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">🖼️</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">Logo Watermark</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Upload logo image
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Text Watermark Settings */}
                                    {watermarkType === 'text' && (
                                        <>
                                            {/* Text Input */}
                                            <div className="mt-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                    Watermark Text
                                                </label>
                                                <input
                                                    type="text"
                                                    value={text}
                                                    onChange={(e) => setText(e.target.value)}
                                                    placeholder="Enter watermark text"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Font Size */}
                                            <div className="mt-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                    Font Size: {fontSize}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="120"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span>Small (20px)</span>
                                                    <span>Large (120px)</span>
                                                </div>
                                            </div>

                                            {/* Text Color */}
                                            <div className="mt-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                    Text Color
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => setColor(e.target.value)}
                                                        className="h-12 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setColor('#ffffff')}
                                                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                            title="White"
                                                        />
                                                        <button
                                                            onClick={() => setColor('#000000')}
                                                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 bg-black"
                                                            title="Black"
                                                        />
                                                        <button
                                                            onClick={() => setColor('#ef4444')}
                                                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 bg-red-500"
                                                            title="Red"
                                                        />
                                                        <button
                                                            onClick={() => setColor('#3b82f6')}
                                                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 bg-blue-500"
                                                            title="Blue"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Image Watermark Settings */}
                                    {watermarkType === 'image' && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                                Watermark Logo
                                            </label>
                                            {!watermarkImage ? (
                                                <Dropzone
                                                    onFileSelect={handleWatermarkImageSelect}
                                                    accept="image/png,image/svg+xml,.png,.svg"
                                                    maxSize={5 * 1024 * 1024}
                                                    label="Drop logo here or click to browse"
                                                    description="PNG or SVG with transparency (Max 5MB)"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">🖼️</div>
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{watermarkImage.name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(watermarkImage.size)}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setWatermarkImage(null)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Opacity */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                            Opacity: {Math.round(opacity * 100)}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={opacity}
                                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>Transparent (10%)</span>
                                            <span>Opaque (100%)</span>
                                        </div>
                                    </div>

                                    {/* Position */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Position
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {positions.map((pos) => (
                                                <button
                                                    key={pos.value}
                                                    onClick={() => setPosition(pos.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${position === pos.value
                                                            ? 'border-cyan-500 bg-cyan-50'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300'
                                                        }`}
                                                >
                                                    <div className="text-2xl mb-1">{pos.icon}</div>
                                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{pos.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Apply Button */}
                                    <div className="mt-6">
                                        <Button
                                            onClick={handleApply}
                                            disabled={isProcessing}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                                        >
                                            {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
                                        </Button>
                                    </div>

                                    {/* Progress */}
                                    {isProcessing && (
                                        <div className="mt-6">
                                            <ProgressBar progress={progress} />
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Results */}
                            {resultImage && (
                                <div className="mt-6">
                                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:to-gray-800 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                ✅ Watermark Added!
                                            </h3>
                                        </div>

                                        {/* Image Preview */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Preview:</div>
                                            <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                                <img
                                                    src={previewUrl}
                                                    alt="Watermarked"
                                                    className="max-w-full max-h-96 rounded-lg"
                                                />
                                            </div>
                                            <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                Size: {formatBytes(resultImage.meta?.outputSize || resultImage.primaryFile.size)}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleDownload}
                                                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                                            >
                                                Download Image
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                variant="secondary"
                                                className="flex-1"
                                            >
                                                Add to Another
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
        </div>
    );
};

export default Watermark;
