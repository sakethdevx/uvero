import { useState, useRef, useEffect, useCallback } from 'react';

const ASPECT_RATIOS = [
    { value: 'freeform', label: 'Freeform', ratio: null },
    { value: 'square', label: '1:1', ratio: 1 },
    { value: '16:9', label: '16:9', ratio: 16 / 9 },
    { value: '4:3', label: '4:3', ratio: 4 / 3 },
    { value: '9:16', label: '9:16', ratio: 9 / 16 },
    { value: '3:2', label: '3:2', ratio: 3 / 2 },
];

/**
 * Interactive canvas-based crop selector.
 * Renders a canvas preview with a draggable crop region and calls
 * `onChange({ x, y, width, height })` whenever the crop area changes.
 */
export default function InteractiveCropSelector({ file, onChange }) {
    const [cropMode, setCropMode] = useState('freeform');
    const [cropArea, setCropArea] = useState(null);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragMode, setDragMode] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Consolidate file → canvas setup in one effect; state updates happen inside async callbacks
    useEffect(() => {
        if (!file) return;
        let cancelled = false;
        const url = URL.createObjectURL(file);

        const timer = setTimeout(() => {
            if (cancelled) return;
            // These setState calls are inside setTimeout (async), not directly in the effect body
            setImageLoading(true);
            setCropArea(null);
            setImageDimensions(null);
            setImageUrl(url);

            if (!canvasRef.current || !containerRef.current) {
                setImageLoading(false);
                return;
            }
            const img = new Image();
            img.onload = () => {
                if (cancelled) return;
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (!canvas || !container) { setImageLoading(false); return; }

                const maxWidth = container.clientWidth || 600;
                const maxHeight = 400;
                let scale = 1;
                if (img.width > maxWidth || img.height > maxHeight) {
                    scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                }
                const dw = Math.round(img.width * scale);
                const dh = Math.round(img.height * scale);

                canvas.width = dw;
                canvas.height = dh;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, dw, dh);

                const dims = { naturalWidth: img.width, naturalHeight: img.height, displayWidth: dw, displayHeight: dh, scale };
                setImageDimensions(dims);

                const margin = 0.1;
                const initial = { x: dw * margin, y: dh * margin, width: dw * (1 - 2 * margin), height: dh * (1 - 2 * margin) };
                setCropArea(initial);
                setImageLoading(false);
            };
            img.onerror = () => setImageLoading(false);
            img.src = url;
        }, 80);
        return () => {
            cancelled = true;
            clearTimeout(timer);
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // Redraw overlay whenever cropArea or imageDimensions changes
    const drawOverlay = useCallback(() => {
        if (!canvasRef.current || !imageUrl || !cropArea || !imageDimensions) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Dark overlay outside crop region
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Reveal crop area
            ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.drawImage(
                img,
                cropArea.x / imageDimensions.scale, cropArea.y / imageDimensions.scale,
                cropArea.width / imageDimensions.scale, cropArea.height / imageDimensions.scale,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height
            );

            // Crop border
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

            // Rule-of-thirds grid lines
            ctx.strokeStyle = 'rgba(6,182,212,0.35)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 2; i++) {
                const gx = cropArea.x + (cropArea.width * i) / 3;
                const gy = cropArea.y + (cropArea.height * i) / 3;
                ctx.beginPath(); ctx.moveTo(gx, cropArea.y); ctx.lineTo(gx, cropArea.y + cropArea.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cropArea.x, gy); ctx.lineTo(cropArea.x + cropArea.width, gy); ctx.stroke();
            }

            // Corner handles
            const hs = 12;
            ctx.fillStyle = '#06b6d4';
            [[cropArea.x, cropArea.y], [cropArea.x + cropArea.width, cropArea.y],
             [cropArea.x, cropArea.y + cropArea.height], [cropArea.x + cropArea.width, cropArea.y + cropArea.height]
            ].forEach(([cx, cy]) => ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs));

            // Edge mid-point handles
            ctx.fillStyle = 'rgba(6,182,212,0.8)';
            const edgePts = [
                [cropArea.x + cropArea.width / 2, cropArea.y],
                [cropArea.x + cropArea.width / 2, cropArea.y + cropArea.height],
                [cropArea.x, cropArea.y + cropArea.height / 2],
                [cropArea.x + cropArea.width, cropArea.y + cropArea.height / 2],
            ];
            edgePts.forEach(([ex, ey]) => ctx.fillRect(ex - 4, ey - 4, 8, 8));
        };
        img.src = imageUrl;
    }, [imageUrl, cropArea, imageDimensions]);

    useEffect(() => {
        drawOverlay();
    }, [drawOverlay]);

    // Notify parent on crop change
    useEffect(() => {
        if (cropArea && imageDimensions && onChange) {
            onChange({
                x: Math.round(cropArea.x / imageDimensions.scale),
                y: Math.round(cropArea.y / imageDimensions.scale),
                width: Math.round(cropArea.width / imageDimensions.scale),
                height: Math.round(cropArea.height / imageDimensions.scale),
            });
        }
    }, [cropArea, imageDimensions, onChange]);

    const getEventPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e) => {
        if (!cropArea || !canvasRef.current) return;
        if (e.type === 'touchstart') e.preventDefault();
        const { x, y } = getEventPos(e, canvasRef.current);
        const hs = 18;
        let mode = null;

        if (Math.abs(x - cropArea.x) < hs && Math.abs(y - cropArea.y) < hs) mode = 'nw';
        else if (Math.abs(x - (cropArea.x + cropArea.width)) < hs && Math.abs(y - cropArea.y) < hs) mode = 'ne';
        else if (Math.abs(x - cropArea.x) < hs && Math.abs(y - (cropArea.y + cropArea.height)) < hs) mode = 'sw';
        else if (Math.abs(x - (cropArea.x + cropArea.width)) < hs && Math.abs(y - (cropArea.y + cropArea.height)) < hs) mode = 'se';
        // Edge mid handles
        else if (Math.abs(x - (cropArea.x + cropArea.width / 2)) < hs && Math.abs(y - cropArea.y) < hs) mode = 'n';
        else if (Math.abs(x - (cropArea.x + cropArea.width / 2)) < hs && Math.abs(y - (cropArea.y + cropArea.height)) < hs) mode = 's';
        else if (Math.abs(x - cropArea.x) < hs && Math.abs(y - (cropArea.y + cropArea.height / 2)) < hs) mode = 'w';
        else if (Math.abs(x - (cropArea.x + cropArea.width)) < hs && Math.abs(y - (cropArea.y + cropArea.height / 2)) < hs) mode = 'e';
        else if (x >= cropArea.x && x <= cropArea.x + cropArea.width && y >= cropArea.y && y <= cropArea.y + cropArea.height) mode = 'move';

        if (mode) {
            setIsDragging(true);
            setDragMode(mode);
            setDragStart({ x, y, cropArea: { ...cropArea } });
        }
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !dragStart || !canvasRef.current) return;
        if (e.type === 'touchmove') e.preventDefault();
        const { x, y } = getEventPos(e, canvasRef.current);
        const canvas = canvasRef.current;
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        const selectedRatio = ASPECT_RATIOS.find(r => r.value === cropMode);
        const minSize = 40;
        let nc = { ...dragStart.cropArea };

        if (dragMode === 'move') {
            nc.x = Math.max(0, Math.min(nc.x + dx, canvas.width - nc.width));
            nc.y = Math.max(0, Math.min(nc.y + dy, canvas.height - nc.height));
        } else if (dragMode === 'se') {
            nc.width = Math.max(minSize, Math.min(nc.width + dx, canvas.width - nc.x));
            nc.height = selectedRatio?.ratio ? nc.width / selectedRatio.ratio : Math.max(minSize, Math.min(nc.height + dy, canvas.height - nc.y));
        } else if (dragMode === 'sw') {
            const newX = Math.max(0, Math.min(nc.x + dx, nc.x + nc.width - minSize));
            const newW = nc.width - (newX - nc.x);
            nc.x = newX; nc.width = newW;
            nc.height = selectedRatio?.ratio ? newW / selectedRatio.ratio : Math.max(minSize, Math.min(nc.height + dy, canvas.height - nc.y));
        } else if (dragMode === 'ne') {
            nc.width = Math.max(minSize, Math.min(nc.width + dx, canvas.width - nc.x));
            const newH = selectedRatio?.ratio ? nc.width / selectedRatio.ratio : Math.max(minSize, nc.height - dy);
            nc.y = nc.y + nc.height - newH; nc.height = newH;
        } else if (dragMode === 'nw') {
            const newX = Math.max(0, Math.min(nc.x + dx, nc.x + nc.width - minSize));
            const newW = nc.width - (newX - nc.x);
            const newH = selectedRatio?.ratio ? newW / selectedRatio.ratio : Math.max(minSize, nc.height - dy);
            nc.x = newX; nc.width = newW; nc.y = nc.y + nc.height - newH; nc.height = newH;
        } else if (dragMode === 'n') {
            const newY = Math.max(0, Math.min(nc.y + dy, nc.y + nc.height - minSize));
            nc.height = nc.height - (newY - nc.y); nc.y = newY;
        } else if (dragMode === 's') {
            nc.height = Math.max(minSize, Math.min(nc.height + dy, canvas.height - nc.y));
        } else if (dragMode === 'w') {
            const newX = Math.max(0, Math.min(nc.x + dx, nc.x + nc.width - minSize));
            nc.width = nc.width - (newX - nc.x); nc.x = newX;
        } else if (dragMode === 'e') {
            nc.width = Math.max(minSize, Math.min(nc.width + dx, canvas.width - nc.x));
        }

        setCropArea(nc);
    };

    const handlePointerUp = () => { setIsDragging(false); setDragStart(null); };

    const handleRatioChange = (mode) => {
        setCropMode(mode);
        if (!cropArea || !imageDimensions) return;
        const selected = ASPECT_RATIOS.find(r => r.value === mode);
        if (selected?.ratio) {
            const newH = cropArea.width / selected.ratio;
            if (cropArea.y + newH <= imageDimensions.displayHeight) {
                setCropArea({ ...cropArea, height: newH });
            } else {
                setCropArea({ ...cropArea, width: cropArea.height * selected.ratio });
            }
        }
    };

    const getCursor = () => {
        if (!isDragging) return 'cursor-crosshair';
        if (dragMode === 'move') return 'cursor-grabbing';
        if (dragMode === 'nw' || dragMode === 'se') return 'cursor-nwse-resize';
        if (dragMode === 'ne' || dragMode === 'sw') return 'cursor-nesw-resize';
        if (dragMode === 'n' || dragMode === 's') return 'cursor-ns-resize';
        if (dragMode === 'e' || dragMode === 'w') return 'cursor-ew-resize';
        return 'cursor-crosshair';
    };

    return (
        <div className="space-y-3">
            {/* Aspect ratio pills */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Aspect Ratio</p>
                <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map(r => (
                        <button
                            key={r.value}
                            onClick={() => handleRatioChange(r.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                cropMode === r.value
                                    ? 'bg-primary-500 text-white border-primary-500'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary-400'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas container */}
            <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-white/10"
                style={{ minHeight: 200 }}
            >
                {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-900">
                        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    className={`block max-w-full mx-auto ${getCursor()}`}
                    style={{ display: imageDimensions ? 'block' : 'none', touchAction: 'none' }}
                />
            </div>

            {/* Crop size info */}
            {cropArea && imageDimensions && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    Crop area: {Math.round(cropArea.width / imageDimensions.scale)} × {Math.round(cropArea.height / imageDimensions.scale)} px
                    {' · '}drag corners or edges to adjust
                </p>
            )}
        </div>
    );
}
