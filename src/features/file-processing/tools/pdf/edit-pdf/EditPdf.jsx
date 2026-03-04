import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { processor } from './processor';

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
            const info = await processor.getPageInfo(selectedFile);
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
            const editedBlob = await processor.edit(
                file,
                annotations,
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                url: URL.createObjectURL(editedBlob),
                filename: `edited_${file.name}`
            });
            setProgress(100);
        } catch (err) {
            console.error('Edit error:', err);
            setError(err.message || 'Failed to edit PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:to-gray-800">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">✏️</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Editor
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Add text annotations to your PDFs. Fast, secure, and completely free.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>100% Client-side</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>No Upload Required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Privacy First</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Unlimited Use</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tool Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">✏️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rich Annotations</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Add text with custom fonts, sizes, colors, and precise positioning on any page.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Web Worker technology ensures smooth editing without freezing your browser.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-violet-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-purple-600 dark:text-purple-400">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add Annotations</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Add text with custom size, color, and position</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Apply</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click apply to embed all annotations into your PDF</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600 dark:text-green-400">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your edited PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What kind of edits can I make?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can add text annotations to any page of your PDF. Customize the font size, color, and exact position
                                of each annotation. Multiple annotations can be added before applying.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All editing happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I add text to specific pages?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! You can select which page each annotation should be placed on using the page selector.
                                Different annotations can target different pages.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can edit PDFs up to 100MB. Processing time depends on file size and the number of annotations.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF editor is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your edited PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
