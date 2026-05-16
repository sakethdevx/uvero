import { useState, useCallback } from 'react';
import { usePdfRotate } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';

export const metadata = {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    category: 'document',
    keywords: ['rotate', 'pdf', 'offline', 'local'],
    icon: '📄',
    offline: true,
    experimental: false
};

export default function RotatePdfTool() {
    const [files, setFiles] = useState([]);
    const [rotation, setRotation] = useState(90);
    const [pageRanges, setPageRanges] = useState('');
    const [rotateAll, setRotateAll] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState(null);

    const { rotate, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfRotate();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
            // Prevent duplicates based on name and size
            const isDuplicate = prev.some(f => f.name === newFile.name && f.size === newFile.size);
            if (isDuplicate) return prev;
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, newFile];
        });
    }, []);

    const handleRemove = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        if (result) reset();
    };

    const handleDragStart = (idx) => setDraggedIdx(idx);

    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;

        setFiles((prev) => {
            const copy = [...prev];
            const item = copy.splice(draggedIdx, 1)[0];
            copy.splice(idx, 0, item);
            return copy;
        });
        setDraggedIdx(idx);
    };

    const handleDragEnd = () => setDraggedIdx(null);

    const handleRotate = () => {
        rotate(files, { 
            rotation, 
            pageRanges, 
            rotateAll 
        });
    };

    const handleRestart = () => {
        setFiles([]);
        setRotation(90);
        setPageRanges('');
        setRotateAll(false);
        reset();
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

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Rotate Options ({files.length} {files.length === 1 ? 'file' : 'files'})</h3>
                        <p className="text-sm text-gray-500">Only one file can be processed at a time</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="font-medium">Rotation Angle</p>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="90"
                                        checked={rotation === 90}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        disabled={isProcessing}
                                    />
                                    <span>90°</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="180"
                                        checked={rotation === 180}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        disabled={isProcessing}
                                    />
                                    <span>180°</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="270"
                                        checked={rotation === 270}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        disabled={isProcessing}
                                    />
                                    <span>270°</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="font-medium">Pages to Rotate</p>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="all"
                                        checked={rotateAll}
                                        onChange={(e) => {
                                            setRotateAll(e.target.value === 'all');
                                            if (e.target.value === 'all') setPageRanges(`1-${files[0] ? 'totalPages' : ''}`);
                                        }}
                                        disabled={isProcessing}
                                    />
                                    <span>All Pages</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="ranges"
                                        checked={!rotateAll}
                                        onChange={(e) => setRotateAll(e.target.value !== 'all')}
                                        disabled={isProcessing}
                                    />
                                    <span>Page Ranges</span>
                                </label>
                            </div>
                        </div>

                        {!rotateAll && (
                            <div className="space-y-2">
                                <p className="font-medium">Page Ranges</p>
                                <p className="text-xs text-gray-500">
                                    Examples: 1-3, 5, 7-10 (one-based indexing)
                                </p>
                                <input
                                    type="text"
                                    value={pageRanges}
                                    onChange={(e) => setPageRanges(e.target.value)}
                                    placeholder="Enter page ranges (e.g., 1-3,5,7-10)"
                                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                    disabled={isProcessing}
                                />
                            </div>
                        )}

                        {rotateAll && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">
                                    All {files.length === 1 ? 'pages' : 'pages'} will be rotated.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                <p className="font-medium">Processing Error</p>
                                <p>{error.message}</p>
                            </div>
                        )}

                        {isProcessing ? (
                            <div className="space-y-4">
                                <ProgressBar progress={progress} />
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>{progressMessage}</p>
                                    <Button onClick={cancel} variant="outline" className="text-red-500 border-red-200">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setFiles([])} variant="outline">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleRotate}
                                    disabled={
                                        files.length === 0 || 
                                        (!rotateAll && !pageRanges.trim()) ||
                                        (isNaN(rotation) || rotation % 90 !== 0)
                                    }
                                    className={
                                        (files.length === 0 || 
                                        (!rotateAll && !pageRanges.trim()) ||
                                        (isNaN(rotation) || rotation % 90 !== 0)) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : ''
                                    }
                                >
                                    Rotate PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-green-200 dark:border-green-800 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">Rotate Complete!</h2>
                        <p className="text-gray-500">
                            Successfully rotated {result.metadata.rotatedPages} {
                                result.metadata.rotatedPages === 1 ? 'page' : 'pages'
                            } by {result.metadata.rotation}°.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleRestart} variant="outline">
                            Start Over
                        </Button>
                        <Button
                            onClick={() => {
                                const url = URL.createObjectURL(result.blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Download PDF
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}