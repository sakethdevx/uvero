import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import editPdfExecutor from './executor';

export default function EditPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [annotations, setAnnotations] = useState([]);
    const fileInputRef = useRef(null);

    // Annotation form state
    const [textContent, setTextContent] = useState('');
    const [fontSize, setFontSize] = useState(12);
    const [color, setColor] = useState('#000000');
    const [page, setPage] = useState(1);
    const [positionX, setPositionX] = useState(50);
    const [positionY, setPositionY] = useState(50);

    const handleFileSelect = async (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
        setAnnotations([]);

        try {
            const info = await editPdfExecutor.getPageInfo(selectedFile);
            setTotalPages(info.totalPages);
            setPage(1);
        } catch (err) {
            setError('Failed to read PDF: ' + err.message);
        }
    };

    const handleAddAnnotation = () => {
        if (!textContent.trim()) {
            setError('Please enter text content');
            return;
        }
        setError(null);
        setAnnotations(prev => [...prev, {
            id: Date.now(),
            type: 'text',
            content: textContent,
            page: page - 1,
            x: positionX,
            y: positionY,
            fontSize,
            color
        }]);
        setTextContent('');
    };

    const handleRemoveAnnotation = (id) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

    const handleApply = async () => {
        if (!file || annotations.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const executionResult = await editPdfExecutor.run({
                files: [file],
                options: {
                    annotations,
                },
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setResult(executionResult);
            setProgress(100);
        } catch (err) {
            console.error('Edit error:', err);
            setError(err.message || 'Failed to edit PDF. Please try again.');
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
        setAnnotations([]);
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

                        {/* Annotation Editor */}
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

                                {/* Add Annotation Panel */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Add Text Annotation
                                    </label>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Text Content</label>
                                            <input
                                                type="text"
                                                value={textContent}
                                                onChange={(e) => setTextContent(e.target.value)}
                                                placeholder="Enter text to add..."
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                disabled={isProcessing}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Font Size</label>
                                                <input
                                                    type="number"
                                                    min="8"
                                                    max="72"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Color</label>
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="w-full h-[42px] px-1 py-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Page</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={totalPages}
                                                    value={page}
                                                    onChange={(e) => setPage(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Position</label>
                                                <select
                                                    onChange={(e) => {
                                                        const positions = {
                                                            'top-left': { x: 50, y: 50 },
                                                            'top-center': { x: 250, y: 50 },
                                                            'top-right': { x: 450, y: 50 },
                                                            'middle-left': { x: 50, y: 400 },
                                                            'middle-center': { x: 250, y: 400 },
                                                            'middle-right': { x: 450, y: 400 },
                                                            'bottom-left': { x: 50, y: 750 },
                                                            'bottom-center': { x: 250, y: 750 },
                                                            'bottom-right': { x: 450, y: 750 }
                                                        };
                                                        const pos = positions[e.target.value];
                                                        if (pos) {
                                                            setPositionX(pos.x);
                                                            setPositionY(pos.y);
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                    disabled={isProcessing}
                                                >
                                                    <option value="top-left">Top Left</option>
                                                    <option value="top-center">Top Center</option>
                                                    <option value="top-right">Top Right</option>
                                                    <option value="middle-left">Middle Left</option>
                                                    <option value="middle-center">Middle Center</option>
                                                    <option value="middle-right">Middle Right</option>
                                                    <option value="bottom-left">Bottom Left</option>
                                                    <option value="bottom-center">Bottom Center</option>
                                                    <option value="bottom-right">Bottom Right</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">X Position</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={positionX}
                                                    onChange={(e) => setPositionX(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Y Position</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={positionY}
                                                    onChange={(e) => setPositionY(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleAddAnnotation}
                                            disabled={isProcessing || !textContent.trim()}
                                            variant="secondary"
                                        >
                                            Add Annotation
                                        </Button>
                                    </div>
                                </div>

                                {/* Annotations List */}
                                {annotations.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                            Pending Annotations ({annotations.length})
                                        </label>
                                        <div className="space-y-2">
                                            {annotations.map((ann) => (
                                                <div key={ann.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
                                                            T
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {ann.content}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Page {ann.page + 1} · {ann.fontSize}px · ({ann.x}, {ann.y})
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveAnnotation(ann.id)}
                                                        disabled={isProcessing}
                                                        className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors ml-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                                        onClick={handleApply}
                                        disabled={isProcessing || annotations.length === 0}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Applying...' : 'Apply All Annotations'}
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
                                                PDF Edited Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200">
                                                {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} applied to your PDF.
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
                                        Download Edited PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Edit Another
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
