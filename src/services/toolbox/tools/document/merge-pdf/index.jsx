import { useState, useCallback } from 'react';
import { usePdfMerge } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';

export const metadata = {
    id: 'merge-pdf',
    name: 'Merge PDF',
    category: 'document',
    keywords: ['combine', 'join', 'pdf', 'offline', 'local'],
    icon: '📄',
    offline: true,
    experimental: false
};

export default function MergePdfTool() {
    const [files, setFiles] = useState([]);
    const [draggedIdx, setDraggedIdx] = useState(null);

    const { merge, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfMerge();

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

    const handleMerge = () => {
        merge(files, { preserveBookmarks: true });
    };

    const handleRestart = () => {
        setFiles([]);
        reset();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={true}
                    description="Drag & drop PDF files here or click to browse"
                />
            )}

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Arrangement Output ({files.length} {files.length === 1 ? 'file' : 'files'})</h3>
                        {files.length > 1 && !isProcessing && (
                            <p className="text-sm text-gray-500">Drag to reorder files</p>
                        )}
                    </div>

                    <div className="space-y-2 mb-6">
                        {files.map((file, idx) => (
                            <div
                                key={`${file.name}-${file.size}-${idx}`}
                                draggable={!isProcessing}
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors ${isProcessing ? 'opacity-50' : 'cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="flex-shrink-0 text-red-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="truncate">
                                        <p className="truncate text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {!isProcessing && (
                                    <button
                                        onClick={() => handleRemove(idx)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                        aria-label="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

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
                                Clear All
                            </Button>
                            <Button
                                onClick={handleMerge}
                                disabled={files.length < 2}
                                className={files.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                Merge PDFs
                            </Button>
                        </div>
                    )}
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
                        <h2 className="text-2xl font-bold mb-2">Merge Complete!</h2>
                        <p className="text-gray-500">Successfully merged {result.metadata.fileCount} files ({result.metadata.pageCount} pages format).</p>
                    </div>

                    <div className="flex justify-center gap-4">
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