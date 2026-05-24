import { useState, useCallback } from 'react';
import { usePdfSplit } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';

export const metadata = {
    id: 'split-pdf',
    name: 'Split PDF',
    category: 'document',
    keywords: ['split', 'extract', 'pdf', 'offline', 'local'],
    icon: '📄',
    offline: true,
    experimental: false,
    multiFile: true,
    pageBased: true,
    securityTool: false,
    workspace: 'pdf-tools',
    processing: 'local-react',
    accepts: ['.pdf'],
    maxFiles: 1
};

export default function SplitPdfTool({ initialFiles = [] }) {
    const [files, setFiles] = useState(initialFiles);
    const [splitMode, setSplitMode] = useState('ranges');
    const [pageRanges, setPageRanges] = useState('');
    const [everyNPages, setEveryNPages] = useState(2);
    const [draggedIdx, setDraggedIdx] = useState(null);

    const { split, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfSplit();

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

    const handleSplit = () => {
        split(files, {
            splitMode,
            pageRanges,
            everyNPages
        });
    };

    const handleRestart = () => {
        setFiles([]);
        setSplitMode('ranges');
        setPageRanges('');
        setEveryNPages(2);
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
                <div className="tool-workspace-panel">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Split Options ({files.length} {files.length === 1 ? 'file' : 'files'})</h3>
                        <p className="text-sm text-gray-500">Only one file can be processed at a time</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="font-medium">Split Mode</p>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="ranges"
                                        checked={splitMode === 'ranges'}
                                        onChange={(e) => {
                                            setSplitMode(e.target.value);
                                            if (e.target.value === 'ranges') setPageRanges('1-5');
                                        }}
                                        disabled={isProcessing}
                                    />
                                    <span>Page Ranges</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="individual"
                                        checked={splitMode === 'individual'}
                                        onChange={(e) => setSplitMode(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                    <span>Individual Pages</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="every-n"
                                        checked={splitMode === 'every-n'}
                                        onChange={(e) => {
                                            setSplitMode(e.target.value);
                                            if (e.target.value === 'every-n') setEveryNPages(2);
                                        }}
                                        disabled={isProcessing}
                                    />
                                    <span>Every N Pages</span>
                                </label>
                            </div>
                        </div>

                        {splitMode === 'ranges' && (
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
                                    className="tool-workspace-input px-3 py-2"
                                    disabled={isProcessing}
                                />
                            </div>
                        )}

                        {splitMode === 'every-n' && (
                            <div className="space-y-2">
                                <p className="font-medium">Every N Pages</p>
                                <input
                                    type="number"
                                    min="1"
                                    value={everyNPages}
                                    onChange={(e) => setEveryNPages(parseInt(e.target.value) || 1)}
                                    className="tool-workspace-input px-3 py-2"
                                    disabled={isProcessing}
                                />
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
                                    onClick={handleSplit}
                                    disabled={files.length === 0 || (splitMode === 'ranges' && !pageRanges.trim())}
                                    className={
                                        (files.length === 0 || (splitMode === 'ranges' && !pageRanges.trim()))
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                    }
                                >
                                    Split PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (
                <div className="tool-workspace-result space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">Split Complete!</h2>
                        <p className="text-gray-500">
                            Successfully split into {result.metadata.outputFiles} {
                                result.metadata.outputFiles === 1 ? 'file' : 'files'
                            } ({result.metadata.sourcePageCount} pages total)
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleRestart} variant="outline">
                            Start Over
                        </Button>
                        {Array.isArray(result.blob) ? (
                            <>
                                {result.metadata.outputFilenames.map((filename, index) => (
                                    <Button
                                        key={index}
                                        onClick={() => {
                                            const url = URL.createObjectURL(result.blob[index]);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }}
                                        variant="outline"
                                    >
                                        Download {filename}
                                    </Button>
                                ))}
                            </>
                        ) : (
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}