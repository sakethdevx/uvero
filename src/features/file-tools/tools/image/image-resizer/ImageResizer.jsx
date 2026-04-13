import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import imageResizerExecutor from './executor';

const ImageResizer = () => {
    const [file, setFile] = useState(null);
    const [resizeMode, setResizeMode] = useState('dimensions'); // 'dimensions' or 'percentage'
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [percentage, setPercentage] = useState('100');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [originalDimensions, setOriginalDimensions] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resizedImage, setResizedImage] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        setResizedImage(null);
        setError('');
        setProgress(0);

        // Get original dimensions
        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        img.onload = () => {
            setOriginalDimensions({ width: img.width, height: img.height });
            setWidth(img.width.toString());
            setHeight(img.height.toString());
            URL.revokeObjectURL(img.src);
        };
    };

    const handleWidthChange = (value) => {
        setWidth(value);
        if (maintainAspectRatio && originalDimensions && value) {
            const newWidth = parseInt(value);
            if (!isNaN(newWidth)) {
                const aspectRatio = originalDimensions.height / originalDimensions.width;
                setHeight(Math.round(newWidth * aspectRatio).toString());
            }
        }
    };

    const handleHeightChange = (value) => {
        setHeight(value);
        if (maintainAspectRatio && originalDimensions && value) {
            const newHeight = parseInt(value);
            if (!isNaN(newHeight)) {
                const aspectRatio = originalDimensions.width / originalDimensions.height;
                setWidth(Math.round(newHeight * aspectRatio).toString());
            }
        }
    };

    const handleResize = async () => {
        if (!file || !originalDimensions) return;

        let targetWidth, targetHeight;

        if (resizeMode === 'percentage') {
            const scale = parseFloat(percentage) / 100;
            targetWidth = Math.round(originalDimensions.width * scale);
            targetHeight = Math.round(originalDimensions.height * scale);
        } else {
            targetWidth = parseInt(width);
            targetHeight = parseInt(height);
        }

        if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
            setError('Please enter valid dimensions');
            return;
        }

        setIsResizing(true);
        setError('');
        setProgress(0);

        try {
            const result = await imageResizerExecutor.run({
                files: [file],
                options: {
                    width: targetWidth,
                    height: targetHeight,
                },
                mode: 'offline',
                onProgress: setProgress,
            });
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const nextPreviewUrl = URL.createObjectURL(result.primaryFile);
            setPreviewUrl(nextPreviewUrl);
            setResizedImage(result);
        } catch (err) {
            setError(err.message || 'Resize failed');
        } finally {
            setIsResizing(false);
        }
    };

    const handleDownload = () => {
        if (!resizedImage) return;

        const url = URL.createObjectURL(resizedImage.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = resizedImage.primaryFile.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setOriginalDimensions(null);
        setResizedImage(null);
        setError('');
        setProgress(0);
        setWidth('');
        setHeight('');
        setPercentage('100');
        setPreviewUrl('');
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const resizedDimensions = resizedImage?.meta?.dimensions?.converted;
    const resizedSize = resizedImage?.meta?.outputSize ?? resizedImage?.primaryFile?.size ?? 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Image Resizer
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Resize images by dimensions or percentage
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                            maxSize={50 * 1024 * 1024}
                            label="Drop your image here or click to browse"
                            description="Supports JPG, PNG, WebP, GIF (Max 50MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {originalDimensions && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        📐 Original: <strong>{originalDimensions.width} × {originalDimensions.height}</strong> pixels
                                    </p>
                                </div>
                            )}

                            {!resizedImage && originalDimensions && (
                                <>
                                    {/* Resize Mode */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Resize Method
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setResizeMode('dimensions')}
                                                className={`p-3 rounded-lg border-2 transition-all ${resizeMode === 'dimensions'
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                    }`}
                                                disabled={isResizing}
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white">By Dimensions</div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Set width & height</div>
                                            </button>
                                            <button
                                                onClick={() => setResizeMode('percentage')}
                                                className={`p-3 rounded-lg border-2 transition-all ${resizeMode === 'percentage'
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                    }`}
                                                disabled={isResizing}
                                            >
                                                <div className="font-semibold text-gray-900 dark:text-white">By Percentage</div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">Scale proportionally</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dimensions Mode */}
                                    {resizeMode === 'dimensions' && (
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                        Width (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={width}
                                                        onChange={(e) => handleWidthChange(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isResizing}
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="text-2xl text-gray-400 dark:text-gray-500 mt-7">×</div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                        Height (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={height}
                                                        onChange={(e) => handleHeightChange(e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={isResizing}
                                                        min="1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="aspectRatio"
                                                    checked={maintainAspectRatio}
                                                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500"
                                                    disabled={isResizing}
                                                />
                                                <label htmlFor="aspectRatio" className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                                                    Maintain aspect ratio
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Percentage Mode */}
                                    {resizeMode === 'percentage' && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Scale Percentage
                                            </label>
                                            <input
                                                type="number"
                                                value={percentage}
                                                onChange={(e) => setPercentage(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isResizing}
                                                min="1"
                                                max="500"
                                            />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                New size: {Math.round(originalDimensions.width * parseFloat(percentage || 100) / 100)} × {Math.round(originalDimensions.height * parseFloat(percentage || 100) / 100)} px
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                {[25, 50, 75, 100, 150, 200].map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => setPercentage(val.toString())}
                                                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:bg-gray-600 rounded"
                                                        disabled={isResizing}
                                                    >
                                                        {val}%
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resize Button */}
                                    <div className="mt-6">
                                        <Button onClick={handleResize} disabled={isResizing} fullWidth>
                                            {isResizing ? 'Resizing...' : 'Resize Image'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Progress */}
                            {isResizing && (
                                <div className="mt-6">
                                    <ProgressBar progress={progress} />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                    <p className="text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            {/* Result */}
                            {resizedImage && (
                                <div className="mt-6 space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-semibold text-green-900 dark:text-green-100">
                                                    Resize Complete!
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    {resizedDimensions?.width} × {resizedDimensions?.height} px • {formatSize(resizedSize)}
                                                </p>
                                            </div>
                                            <div className="text-3xl">✅</div>
                                        </div>

                                        {/* Image Preview */}
                                        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center" style={{ maxHeight: '300px' }}>
                                            <img
                                                src={previewUrl}
                                                alt="Resized"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Original</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {originalDimensions.width} × {originalDimensions.height}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <p className="text-gray-600 dark:text-gray-300">Resized</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {resizedDimensions?.width} × {resizedDimensions?.height}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(resizedSize)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button onClick={handleDownload} fullWidth>
                                            Download Image
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary" fullWidth>
                                            Resize Another
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">📏</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Precise Control</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Set exact dimensions or scale by percentage
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Aspect Ratio Lock</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Maintain proportions or resize freely
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">⚡</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Preview</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            See results immediately before download
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                What's the difference between the two resize methods?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>By Dimensions:</strong> Set exact width and height in pixels.
                                <strong> By Percentage:</strong> Scale proportionally (e.g., 50% makes it half the size).
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Will resizing reduce image quality?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Enlarging images (scaling up) may reduce quality. Reducing size generally maintains quality.
                                The tool uses high-quality resampling algorithms for best results.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Can I resize multiple images at once?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Currently, images are resized one at a time. Process each image individually for
                                precise control over dimensions.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Are my images uploaded to a server?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No! All image resizing happens locally in your browser using Canvas API.
                                Your images never leave your device.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageResizer;
