import { useState, useCallback } from 'react';
import { useWatermarkPdf } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';
import { WATERMARK_POSITIONS, WATERMARK_ROTATIONS } from '../shared/pdfWatermark/watermarkConstants';

export const metadata = {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    category: 'document',
    keywords: ['watermark', 'text', 'pdf', 'offline', 'local'],
    icon: '💧',
    offline: true,
    experimental: false
};

export default function WatermarkPdfTool() {
    const [files, setFiles] = useState([]);

    // Watermark options state
    const [text, setText] = useState('');
    const [position, setPosition] = useState(WATERMARK_POSITIONS.CENTER);
    const [opacity, setOpacity] = useState(0.3);
    const [rotation, setRotation] = useState(WATERMARK_ROTATIONS.DIAGONAL);
    const [fontSize, setFontSize] = useState(48);
    const [pages, setPages] = useState(''); // Empty means all pages

    const { process, cancel, reset, isProcessing, progress, progressMessage, error, result } = useWatermarkPdf();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
            const isDuplicate = prev.some(f => f.name === newFile.name && f.size === newFile.size);
            if (isDuplicate) return prev;
            if (prev.length >= 1) return [newFile]; // Replace with new file
            return [newFile];
        });
    }, []);

    const handleRemove = () => {
        setFiles([]);
        if (result) reset();
    };

    const handleProcess = () => {
        if (files.length === 0) return;

        let targetPages = 'all';
        if (pages.trim()) {
            targetPages = pages.trim();
        }

        process(files, {
            text,
            position,
            opacity: parseFloat(opacity),
            rotation: parseFloat(rotation),
            fontSize: parseInt(fontSize, 10),
            pages: targetPages
        });
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drag & drop a PDF file here or click to browse"
                />
            )}

            {files.length > 0 && !result && !isProcessing && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-lg truncate max-w-sm">{files[0].name}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                                {(files[0].size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Watermark Text</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:border-gray-700"
                                placeholder="E.g. CONFIDENTIAL"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Position</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:border-gray-700"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                >
                                    <option value={WATERMARK_POSITIONS.CENTER}>Center</option>
                                    <option value={WATERMARK_POSITIONS.TOP_LEFT}>Top Left</option>
                                    <option value={WATERMARK_POSITIONS.TOP_RIGHT}>Top Right</option>
                                    <option value={WATERMARK_POSITIONS.BOTTOM_LEFT}>Bottom Left</option>
                                    <option value={WATERMARK_POSITIONS.BOTTOM_RIGHT}>Bottom Right</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Rotation</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:border-gray-700"
                                    value={rotation}
                                    onChange={(e) => setRotation(parseFloat(e.target.value))}
                                >
                                    <option value={WATERMARK_ROTATIONS.NONE}>0° (Horizontal)</option>
                                    <option value={WATERMARK_ROTATIONS.DIAGONAL}>-45° (Diagonal)</option>
                                    <option value={WATERMARK_ROTATIONS.VERTICAL}>90° (Vertical Up)</option>
                                    <option value={WATERMARK_ROTATIONS.VERTICAL_REV}>-90° (Vertical Down)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Font Size: {fontSize}px</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="144"
                                    className="w-full"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Opacity: {Math.round(opacity * 100)}%</label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.1"
                                    className="w-full"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Page Range (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:border-gray-700"
                                placeholder="E.g. 1-3, 5 (Leave empty for all pages)"
                                value={pages}
                                onChange={(e) => setPages(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                                {error.message}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleProcess}
                                disabled={!text.trim()}
                            >
                                Add Watermark
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isProcessing && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center space-y-6">
                    <ProgressBar progress={progress} />
                    <p className="text-gray-600 dark:text-gray-300">
                        {progressMessage || 'Processing...'}
                    </p>
                    <Button variant="secondary" onClick={cancel}>Cancel</Button>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center space-y-6">
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center text-2xl">
                        ✓
                    </div>
                    <div>
                        <h3 className="text-xl font-medium mb-2">Watermark Added</h3>
                        <p className="text-gray-500">
                            Processed {result.metadata.watermarkedPages} pages successfully.
                        </p>
                    </div>
                    <div className="flex justify-center space-x-4">
                        <Button variant="secondary" onClick={reset}>Try Another</Button>
                        <Button onClick={handleDownload} icon="💾">Download PDF</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
