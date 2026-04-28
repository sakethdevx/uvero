import { useState, useRef, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import signPdfExecutor from './executor';

export default function SignPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const fileInputRef = useRef(null);

    // Signature state
    const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'type'
    const [typedSignature, setTypedSignature] = useState('');
    const [signatureDataUrl, setSignatureDataUrl] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Placement state
    const [page, setPage] = useState(1);
    const [position, setPosition] = useState('bottom-right');
    const [customX, setCustomX] = useState(350);
    const [customY, setCustomY] = useState(750);
    const [sigWidth, setSigWidth] = useState(150);
    const [sigHeight, setSigHeight] = useState(50);

    const canvasRef = useRef(null);

    useEffect(() => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [signatureMode]);

    const getCanvasPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const handleCanvasStart = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const handleCanvasMove = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPos(e, canvas);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const handleCanvasEnd = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
        }
    };

    const handleClearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        setSignatureDataUrl(null);
    };

    const generateTypedSignature = () => {
        if (!typedSignature.trim()) return;
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = 'italic 48px Georgia, serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, 20, 60);
        setSignatureDataUrl(canvas.toDataURL('image/png'));
    };

    useEffect(() => {
        if (signatureMode === 'type') {
            const timeout = setTimeout(generateTypedSignature, 300);
            return () => clearTimeout(timeout);
        }
    }, [typedSignature, signatureMode]);

    const handleFileSelect = async (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);

        try {
            const info = await signPdfExecutor.getPageInfo(selectedFile);
            setTotalPages(info.totalPages);
            setPage(1);
        } catch (err) {
            setError('Failed to read PDF: ' + err.message);
        }
    };

    const getPositionCoords = () => {
        const positions = {
            'bottom-left': { x: 50, y: 750 },
            'bottom-center': { x: 220, y: 750 },
            'bottom-right': { x: 390, y: 750 },
            'custom': { x: customX, y: customY }
        };
        return positions[position] || positions['bottom-right'];
    };

    const handleSign = async () => {
        if (!file || !signatureDataUrl) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const coords = getPositionCoords();
            const executionResult = await signPdfExecutor.run({
                files: [file],
                options: {
                    signatureDataUrl,
                    placement: {
                    page: page - 1,
                    x: coords.x,
                    y: coords.y,
                    width: sigWidth,
                    height: sigHeight
                    },
                },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);
            setProgress(100);
        } catch (err) {
            console.error('Sign error:', err);
            setError(err.message || 'Failed to sign PDF. Please try again.');
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
        setSignatureDataUrl(null);
        setTypedSignature('');
        setTotalPages(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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

                        {/* Signature Editor */}
                        {file && !result && (
                            <div className="space-y-6">
                                {/* File header */}
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📄</span>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{totalPages} page{totalPages !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleReset} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 text-xl">✕</button>
                                </div>

                                {/* Signature Creation */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Create Your Signature
                                    </label>

                                    {/* Mode Tabs */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => { setSignatureMode('draw'); setSignatureDataUrl(null); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${signatureMode === 'draw'
                                                ? 'bg-sky-500 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                            disabled={isProcessing}
                                        >
                                            ✏️ Draw
                                        </button>
                                        <button
                                            onClick={() => { setSignatureMode('type'); setSignatureDataUrl(null); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${signatureMode === 'type'
                                                ? 'bg-sky-500 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                            disabled={isProcessing}
                                        >
                                            ⌨️ Type
                                        </button>
                                    </div>

                                    {/* Draw Mode */}
                                    {signatureMode === 'draw' && (
                                        <div className="space-y-3">
                                            <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                                <canvas
                                                    ref={canvasRef}
                                                    width={500}
                                                    height={150}
                                                    className="w-full cursor-crosshair touch-none"
                                                    onMouseDown={handleCanvasStart}
                                                    onMouseMove={handleCanvasMove}
                                                    onMouseUp={handleCanvasEnd}
                                                    onMouseLeave={handleCanvasEnd}
                                                    onTouchStart={handleCanvasStart}
                                                    onTouchMove={handleCanvasMove}
                                                    onTouchEnd={handleCanvasEnd}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Draw your signature above using your mouse or finger</p>
                                            <Button onClick={handleClearCanvas} variant="secondary" disabled={isProcessing}>
                                                Clear Signature
                                            </Button>
                                        </div>
                                    )}

                                    {/* Type Mode */}
                                    {signatureMode === 'type' && (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={typedSignature}
                                                onChange={(e) => setTypedSignature(e.target.value)}
                                                placeholder="Type your name..."
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-2xl italic"
                                                style={{ fontFamily: 'Georgia, serif' }}
                                                disabled={isProcessing}
                                            />
                                            {signatureDataUrl && (
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                                                    <img src={signatureDataUrl} alt="Signature preview" className="max-h-16" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Placement Options */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Placement Options
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Page</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={totalPages}
                                                value={page}
                                                onChange={(e) => setPage(Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Position</label>
                                            <select
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                disabled={isProcessing}
                                            >
                                                <option value="bottom-left">Bottom Left</option>
                                                <option value="bottom-center">Bottom Center</option>
                                                <option value="bottom-right">Bottom Right</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Width</label>
                                            <input
                                                type="range"
                                                min="50"
                                                max="400"
                                                value={sigWidth}
                                                onChange={(e) => {
                                                    const w = Number(e.target.value);
                                                    setSigWidth(w);
                                                    setSigHeight(Math.round(w / 3));
                                                }}
                                                className="w-full mt-2"
                                                disabled={isProcessing}
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{sigWidth}px</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Height</label>
                                            <input
                                                type="range"
                                                min="20"
                                                max="200"
                                                value={sigHeight}
                                                onChange={(e) => setSigHeight(Number(e.target.value))}
                                                className="w-full mt-2"
                                                disabled={isProcessing}
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{sigHeight}px</p>
                                        </div>
                                    </div>

                                    {position === 'custom' && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">X Position</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={customX}
                                                    onChange={(e) => setCustomX(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Y Position</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={customY}
                                                    onChange={(e) => setCustomY(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </div>
                                    )}
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
                                        onClick={handleSign}
                                        disabled={isProcessing || !signatureDataUrl}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Signing...' : 'Apply Signature'}
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
                                                PDF Signed Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                Your signature has been added to page {page} of the document.
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
                                        Download Signed PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Sign Another
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
