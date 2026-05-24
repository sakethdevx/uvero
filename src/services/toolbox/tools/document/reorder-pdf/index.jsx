import { useState, useCallback, useEffect, useRef } from 'react';
import { usePdfReorder } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';
import { generatePdfThumbnail } from '../shared/pdfThumbnailGenerator';

export const metadata = {
    id: 'reorder-pdf',
    name: 'Reorder Pages',
    category: 'document',
    keywords: ['reorder', 'sort', 'pdf', 'offline', 'local'],
    icon: '📄',
    offline: true,
    experimental: false,
    multiFile: true,
    pageBased: true,
    securityTool: false,
    workspace: 'pdf-tools',
    processing: 'local-react',
    accepts: ['.pdf'],
    maxFiles: 100
};

export default function ReorderPdfTool({ initialFiles = [] }) {
    const [files, setFiles] = useState(initialFiles);
    const [pageOrder, setPageOrder] = useState([]);
    const [thumbnails, setThumbnails] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);

    const { reorder, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfReorder();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
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

    // When a file is selected, generate initial page order and thumbnails
    useEffect(() => {
        if (files.length > 0) {
            const file = files[0];
            // We need to get total pages. Use pdf-lib in the engine to get page count, but we need it in UI to set up initial order.
            // For simplicity, we'll approximate by waiting for the worker to validate? Actually we need the total pages to generate the correct number of thumbnails.
            // We can get total pages by loading the PDF in the UI using pdf-lib, but to avoid duplication we can let the worker handle it.
            // However, we need the page count to render thumbnails.
            // We'll use a separate logic: load the PDF client-side using pdf-lib to get page count, then generate thumbnails.
            // This is acceptable because we need to display thumbnails.
            const setupThumbnails = async () => {
                setIsLoadingThumbnails(true);
                try {
                    const { loadPdfLib } = await import('../shared/pdfEngine');
                    const { loadFileAsArrayBuffer } = await import('../shared/pdfUtils');
                    const pdfLib = await loadPdfLib();
                    const arrayBuffer = await loadFileAsArrayBuffer(file);
                    const pdf = await pdfLib.PDFDocument.load(arrayBuffer);
                    const totalPages = pdf.getPageCount();

                    // Set initial page order (0, 1, 2, ..., totalPages-1)
                    const initialOrder = Array.from({ length: totalPages }, (_, i) => i);
                    setPageOrder(initialOrder);

                    // Generate thumbnails for each page (in parallel but limited to avoid memory spike)
                    const thumbnailPromises = [];
                    for (let i = 1; i <= totalPages; i++) {
                        thumbnailPromises.push(generatePdfThumbnail(file, 120, i));
                    }
                    const thumbs = await Promise.all(thumbnailPromises);
                    setThumbnails(thumbs);
                } catch (err) {
                    console.error('Failed to load PDF for thumbnails:', err);
                } finally {
                    setIsLoadingThumbnails(false);
                }
            };

            setupThumbnails();
        } else {
            setPageOrder([]);
            setThumbnails([]);
        }
    }, [files]);

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        setPageOrder((prev) => {
            const newOrder = [...prev];
            const draggedItem = newOrder[draggedIndex];
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(index, 0, draggedItem);
            return newOrder;
        });
        setDraggedIndex(index);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const handleReorder = () => {
        reorder(files, { newOrder: pageOrder });
    };

    const handleRestart = () => {
        setFiles([]);
        setPageOrder([]);
        setThumbnails([]);
        reset();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {files.length === 0 && !result && !isProcessing && (
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
                        <h3 className="font-medium text-lg">Reorder Pages ({files.length} file)</h3>
                        <p className="text-sm text-gray-500">Drag thumbnails to reorder</p>
                    </div>

                    {isLoadingThumbnails ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading page thumbnails...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {pageOrder.map((originalIndex, displayIndex) => {
                                    const thumbnail = thumbnails[originalIndex];
                                    return (
                                        <div
                                            key={originalIndex}
                                            draggable
                                            onDragStart={() => handleDragStart(displayIndex)}
                                            onDragOver={(e) => handleDragOver(e, displayIndex)}
                                            onDragEnd={handleDragEnd}
                                            className={`border border-gray-200 dark:border-gray-700 rounded-lg p-2 cursor-move transition-colors ${draggedIndex === displayIndex ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'
                                                }`}
                                        >
                                            <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded mb-2 overflow-hidden">
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt={`Page ${originalIndex + 1}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-center text-gray-600 dark:text-gray-300">Page {originalIndex + 1}</p>
                                        </div>
                                    );
                                })}
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
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={handleReorder}
                                        disabled={files.length === 0 || pageOrder.length === 0}
                                        className={
                                            (files.length === 0 || pageOrder.length === 0)
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                        }
                                    >
                                        Reorder Pages
                                    </Button>
                                </div>
                            )}
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
                        <h2 className="text-2xl font-bold mb-2">Reorder Complete!</h2>
                        <p className="text-gray-500">
                            Successfully reordered {result.metadata.pageCount} pages.
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