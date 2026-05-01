import { useState, useRef, useEffect, useCallback } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import imageCropperExecutor from './executor';

const ImageCropper = () => {
    const [file, setFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [cropMode, setCropMode] = useState('freeform'); // 'freeform', 'square', '16:9', '4:3', '1:1'
    const [cropArea, setCropArea] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragMode, setDragMode] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se'
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [croppedImage, setCroppedImage] = useState(null);
    const [error, setError] = useState('');
    const [imageDimensions, setImageDimensions] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [croppedPreviewUrl, setCroppedPreviewUrl] = useState(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const aspectRatios = [
        { value: 'freeform', label: 'Freeform', ratio: null, icon: '🔲' },
        { value: 'square', label: 'Square (1:1)', ratio: 1, icon: '⬛' },
        { value: '16:9', label: 'Widescreen (16:9)', ratio: 16 / 9, icon: '🖥️' },
        { value: '4:3', label: 'Standard (4:3)', ratio: 4 / 3, icon: '📺' },
        { value: '9:16', label: 'Portrait (9:16)', ratio: 9 / 16, icon: '📱' }
    ];

    const handleFileSelect = (selectedFile) => {
        console.log('File selected:', selectedFile.name);
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        if (croppedPreviewUrl) {
            URL.revokeObjectURL(croppedPreviewUrl);
        }
        setFile(selectedFile);
        setImageLoading(true);
        const url = URL.createObjectURL(selectedFile);
        console.log('Image URL created:', url);
        setImageUrl(url);
        setCroppedImage(null);
        setCroppedPreviewUrl(null);
        setError('');
        setProgress(0);
        setCropArea(null);
    };

    useEffect(() => {
        console.log('useEffect triggered. imageUrl:', imageUrl, 'canvasRef:', canvasRef.current, 'containerRef:', containerRef.current);
        if (!imageUrl) return;

        // Use setTimeout to ensure refs are attached after render
        const timer = setTimeout(() => {
            if (canvasRef.current && containerRef.current) {
                const img = new Image();
                img.onload = () => {
                    console.log('Image loaded. Natural size:', img.width, 'x', img.height);
                    const canvas = canvasRef.current;
                    const container = containerRef.current;

                    if (!canvas || !container) {
                        console.log('Canvas or container missing in onload');
                        setImageLoading(false);
                        return;
                    }

                    const maxWidth = container.clientWidth || 800;
                    const maxHeight = 600;
                    console.log('Container width:', container.clientWidth, 'Using maxWidth:', maxWidth);

                    let scale = 1;
                    if (img.width > maxWidth || img.height > maxHeight) {
                        scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    }

                    const displayWidth = img.width * scale;
                    const displayHeight = img.height * scale;

                    canvas.width = displayWidth;
                    canvas.height = displayHeight;
                    console.log('Canvas dimensions set:', displayWidth, 'x', displayHeight);

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
                    console.log('Image drawn on canvas');

                    setImageDimensions({
                        naturalWidth: img.width,
                        naturalHeight: img.height,
                        displayWidth,
                        displayHeight,
                        scale
                    });

                    // Set initial crop area (80% of image)
                    const margin = 0.1;
                    const initialCropArea = {
                        x: displayWidth * margin,
                        y: displayHeight * margin,
                        width: displayWidth * (1 - 2 * margin),
                        height: displayHeight * (1 - 2 * margin)
                    };
                    console.log('Setting initial crop area:', initialCropArea);
                    setCropArea(initialCropArea);
                    setImageLoading(false);
                };
                img.onerror = () => {
                    setError('Failed to load image');
                    setImageLoading(false);
                };
                img.src = imageUrl;
            } else {
                console.log('Refs not ready, retrying...');
                setImageLoading(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [imageUrl]);

    const drawCropOverlay = useCallback(() => {
        if (!canvasRef.current || !imageUrl || !cropArea) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Redraw image
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Draw dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear crop area
            ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.drawImage(
                img,
                cropArea.x / imageDimensions.scale,
                cropArea.y / imageDimensions.scale,
                cropArea.width / imageDimensions.scale,
                cropArea.height / imageDimensions.scale,
                cropArea.x,
                cropArea.y,
                cropArea.width,
                cropArea.height
            );

            // Draw crop border
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

            // Draw corner handles
            const handleSize = 10;
            ctx.fillStyle = '#06b6d4';
            const corners = [
                [cropArea.x, cropArea.y],
                [cropArea.x + cropArea.width, cropArea.y],
                [cropArea.x, cropArea.y + cropArea.height],
                [cropArea.x + cropArea.width, cropArea.y + cropArea.height]
            ];
            corners.forEach(([x, y]) => {
                ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            });
        };
        img.src = imageUrl;
    }, [imageUrl, cropArea, imageDimensions]);

    useEffect(() => {
        if (cropArea && imageDimensions) {
            drawCropOverlay();
        }
    }, [cropArea, imageDimensions, drawCropOverlay]);

    const handleMouseDown = (e) => {
        if (!cropArea || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const handleSize = 15;

        // Check which handle or area was clicked
        let mode = null;

        // Check corners (priority)
        if (Math.abs(x - cropArea.x) < handleSize && Math.abs(y - cropArea.y) < handleSize) {
            mode = 'nw';
        } else if (Math.abs(x - (cropArea.x + cropArea.width)) < handleSize && Math.abs(y - cropArea.y) < handleSize) {
            mode = 'ne';
        } else if (Math.abs(x - cropArea.x) < handleSize && Math.abs(y - (cropArea.y + cropArea.height)) < handleSize) {
            mode = 'sw';
        } else if (Math.abs(x - (cropArea.x + cropArea.width)) < handleSize && Math.abs(y - (cropArea.y + cropArea.height)) < handleSize) {
            mode = 'se';
        } else if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
            y >= cropArea.y && y <= cropArea.y + cropArea.height) {
            mode = 'move';
        }

        if (mode) {
            setIsDragging(true);
            setDragMode(mode);
            setDragStart({ x, y, cropArea: { ...cropArea } });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !dragStart || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const dx = x - dragStart.x;
        const dy = y - dragStart.y;

        const selectedRatio = aspectRatios.find(r => r.value === cropMode);
        const minSize = 50;

        let newCrop = { ...dragStart.cropArea };

        if (dragMode === 'move') {
            // Move the entire crop area
            newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, canvas.width - dragStart.cropArea.width));
            newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, canvas.height - dragStart.cropArea.height));
        } else if (dragMode === 'se') {
            // Southeast (bottom-right)
            if (selectedRatio?.ratio) {
                const ratio = selectedRatio.ratio;
                let newWidth = Math.max(minSize, dragStart.cropArea.width + dx);
                let newHeight = newWidth / ratio;

                newWidth = Math.min(newWidth, canvas.width - dragStart.cropArea.x);
                newHeight = Math.min(newHeight, canvas.height - dragStart.cropArea.y);

                if (newHeight * ratio > canvas.width - dragStart.cropArea.x) {
                    newHeight = (canvas.width - dragStart.cropArea.x) / ratio;
                    newWidth = newHeight * ratio;
                }

                newCrop.width = newWidth;
                newCrop.height = newHeight;
            } else {
                newCrop.width = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, canvas.width - dragStart.cropArea.x));
                newCrop.height = Math.max(minSize, Math.min(dragStart.cropArea.height + dy, canvas.height - dragStart.cropArea.y));
            }
        } else if (dragMode === 'nw') {
            // Northwest (top-left)
            if (selectedRatio?.ratio) {
                const ratio = selectedRatio.ratio;
                const newX = Math.max(0, dragStart.cropArea.x + dx);
                let newWidth = dragStart.cropArea.width - (newX - dragStart.cropArea.x);
                let newHeight = newWidth / ratio;

                if (newWidth > minSize && newHeight > minSize) {
                    newCrop.x = newX;
                    newCrop.y = dragStart.cropArea.y + dragStart.cropArea.height - newHeight;
                    newCrop.width = newWidth;
                    newCrop.height = newHeight;
                }
            } else {
                const newX = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - minSize));
                const newY = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - minSize));
                newCrop.x = newX;
                newCrop.y = newY;
                newCrop.width = dragStart.cropArea.width - (newX - dragStart.cropArea.x);
                newCrop.height = dragStart.cropArea.height - (newY - dragStart.cropArea.y);
            }
        } else if (dragMode === 'ne') {
            // Northeast (top-right)
            if (selectedRatio?.ratio) {
                const ratio = selectedRatio.ratio;
                let newWidth = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, canvas.width - dragStart.cropArea.x));
                let newHeight = newWidth / ratio;

                if (newWidth > minSize && newHeight > minSize) {
                    newCrop.y = dragStart.cropArea.y + dragStart.cropArea.height - newHeight;
                    newCrop.width = newWidth;
                    newCrop.height = newHeight;
                }
            } else {
                const newY = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - minSize));
                newCrop.y = newY;
                newCrop.width = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, canvas.width - dragStart.cropArea.x));
                newCrop.height = dragStart.cropArea.height - (newY - dragStart.cropArea.y);
            }
        } else if (dragMode === 'sw') {
            // Southwest (bottom-left)
            if (selectedRatio?.ratio) {
                const ratio = selectedRatio.ratio;
                const newX = Math.max(0, dragStart.cropArea.x + dx);
                let newWidth = dragStart.cropArea.width - (newX - dragStart.cropArea.x);
                let newHeight = newWidth / ratio;

                if (newWidth > minSize && newHeight > minSize && dragStart.cropArea.y + newHeight <= canvas.height) {
                    newCrop.x = newX;
                    newCrop.width = newWidth;
                    newCrop.height = newHeight;
                }
            } else {
                const newX = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - minSize));
                newCrop.x = newX;
                newCrop.width = dragStart.cropArea.width - (newX - dragStart.cropArea.x);
                newCrop.height = Math.max(minSize, Math.min(dragStart.cropArea.height + dy, canvas.height - dragStart.cropArea.y));
            }
        }

        setCropArea(newCrop);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    const handleCropModeChange = (mode) => {
        setCropMode(mode);
        if (cropArea && imageDimensions) {
            const selectedRatio = aspectRatios.find(r => r.value === mode);
            if (selectedRatio?.ratio) {
                // Adjust crop area to match aspect ratio
                const ratio = selectedRatio.ratio;
                const newHeight = cropArea.width / ratio;
                if (cropArea.y + newHeight <= imageDimensions.displayHeight) {
                    setCropArea({ ...cropArea, height: newHeight });
                } else {
                    const newWidth = cropArea.height * ratio;
                    setCropArea({ ...cropArea, width: newWidth });
                }
            }
        }
    };

    const handleCrop = async () => {
        if (!file || !cropArea || !imageDimensions) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            // Convert display coordinates to natural coordinates
            const naturalCrop = {
                x: cropArea.x / imageDimensions.scale,
                y: cropArea.y / imageDimensions.scale,
                width: cropArea.width / imageDimensions.scale,
                height: cropArea.height / imageDimensions.scale
            };

            const result = await imageCropperExecutor.run({
                files: [file],
                options: { cropArea: naturalCrop },
                onProgress: (prog) => setProgress(prog),
            });
            if (croppedPreviewUrl) {
                URL.revokeObjectURL(croppedPreviewUrl);
            }
            const nextPreviewUrl = URL.createObjectURL(result.primaryFile);
            setCroppedPreviewUrl(nextPreviewUrl);
            setCroppedImage(result);
        } catch (err) {
            setError(err.message || 'Failed to crop image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!croppedImage) return;
        const url = URL.createObjectURL(croppedImage.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = croppedImage.primaryFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        if (croppedPreviewUrl) {
            URL.revokeObjectURL(croppedPreviewUrl);
        }
        setFile(null);
        setImageUrl(null);
        setCroppedImage(null);
        setCroppedPreviewUrl(null);
        setError('');
        setProgress(0);
        setCropArea(null);
        setImageDimensions(null);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const croppedSize = croppedImage?.meta?.outputSize ?? croppedImage?.primaryFile?.size ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="max-w-5xl mx-auto">

                {/* Main Content */}
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

                            {!croppedImage && (
                                <>
                                    {/* Aspect Ratio Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Aspect Ratio
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {aspectRatios.map((ratio) => (
                                                <button
                                                    key={ratio.value}
                                                    onClick={() => handleCropModeChange(ratio.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${cropMode === ratio.value
                                                        ? 'border-amber-500 bg-amber-50'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                                                        }`}
                                                >
                                                    <div className="text-2xl mb-1">{ratio.icon}</div>
                                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                                        {ratio.label}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Canvas */}
                                    <div className="mt-6" ref={containerRef}>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            Drag any corner to resize, or drag inside the area to move it
                                        </div>
                                        <div className="relative flex items-center justify-center min-h-[400px]">
                                            {imageLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 z-10">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                                                        <p className="text-gray-600 dark:text-gray-300">Loading image...</p>
                                                    </div>
                                                </div>
                                            )}
                                            <canvas
                                                ref={canvasRef}
                                                onMouseDown={handleMouseDown}
                                                onMouseMove={handleMouseMove}
                                                onMouseUp={handleMouseUp}
                                                onMouseLeave={handleMouseUp}
                                                className="border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-move max-w-full"
                                                style={{ display: imageDimensions ? 'block' : 'none' }}
                                            />
                                        </div>
                                        {cropArea && imageDimensions && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                Crop size: {Math.round(cropArea.width / imageDimensions.scale)} × {Math.round(cropArea.height / imageDimensions.scale)} px
                                            </div>
                                        )}
                                    </div>

                                    {/* Crop Button */}
                                    <div className="mt-6">
                                        <Button
                                            onClick={handleCrop}
                                            disabled={isProcessing || !cropArea}
                                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                                        >
                                            {isProcessing ? 'Cropping...' : 'Crop Image'}
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
                            {croppedImage && (
                                <div className="mt-6">
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                ✅ Image Cropped!
                                            </h3>
                                        </div>

                                        {/* Image Preview */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Preview:</div>
                                            <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                                                <img
                                                    src={croppedPreviewUrl}
                                                    alt="Cropped"
                                                    className="max-w-full max-h-96 rounded-lg"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="text-center">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Original</div>
                                                    <div className="font-semibold">{formatBytes(file.size)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">Cropped</div>
                                                    <div className="font-semibold text-amber-600">
                                                        {formatBytes(croppedSize)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleDownload}
                                                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                                            >
                                                Download Cropped Image
                                            </Button>
                                            <Button
                                                onClick={handleReset}
                                                variant="secondary"
                                                className="flex-1"
                                            >
                                                Crop Another
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div >
        </div >
    );
};

export default ImageCropper;
