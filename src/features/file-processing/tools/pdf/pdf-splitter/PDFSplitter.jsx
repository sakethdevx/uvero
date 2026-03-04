import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const PDFSplitter = () => {
    const [file, setFile] = useState(null);
    const [pageInfo, setPageInfo] = useState(null);
    const [splitMode, setSplitMode] = useState('pages'); // 'pages', 'ranges', 'all'
    const [selectedPages, setSelectedPages] = useState('');
    const [ranges, setRanges] = useState('');
    const [isSplitting, setIsSplitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [splitPDFs, setSplitPDFs] = useState(null);
    const [error, setError] = useState('');

    const modes = [
        { value: 'all', label: 'Split All Pages', description: 'Each page becomes a separate PDF' },
        { value: 'pages', label: 'Extract Pages', description: 'Select specific pages to extract' },
        { value: 'ranges', label: 'Split by Ranges', description: 'Split into multiple PDFs by page ranges' }
    ];

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        setSplitPDFs(null);
        setError('');
        setProgress(0);

        // Get page count
        try {
            const info = await processor.getPageInfo(selectedFile);
            setPageInfo(info);
        } catch {
            setError('Failed to read PDF information');
        }
    };

    const handleSplit = async () => {
        if (!file || !pageInfo) return;

        // Validate input based on mode
        if (splitMode === 'pages' && !selectedPages.trim()) {
            setError('Please enter page numbers to extract');
            return;
        }
        if (splitMode === 'ranges' && !ranges.trim()) {
            setError('Please enter page ranges to split');
            return;
        }

        setIsSplitting(true);
        setError('');
        setProgress(0);

        try {
            const result = await processor.split(
                file,
                splitMode,
                splitMode === 'pages' ? selectedPages : ranges,
                pageInfo.totalPages,
                (progressValue) => setProgress(progressValue)
            );

            setSplitPDFs(result);
        } catch (err) {
            setError(err.message || 'Split failed');
        } finally {
            setIsSplitting(false);
        }
    };

    const handleDownload = (pdf) => {
        const link = document.createElement('a');
        link.href = pdf.url;
        link.download = pdf.filename;
        link.click();
    };

    const handleDownloadAll = () => {
        if (!splitPDFs) return;
        splitPDFs.files.forEach((pdf, index) => {
            setTimeout(() => handleDownload(pdf), index * 100);
        });
    };

    const handleReset = () => {
        setFile(null);
        setPageInfo(null);
        setSplitPDFs(null);
        setError('');
        setProgress(0);
        setSelectedPages('');
        setRanges('');
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-900 to-indigo-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        PDF Splitter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Split PDF into separate pages or extract specific pages
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept="application/pdf,.pdf"
                            maxSize={100 * 1024 * 1024}
                            label="Drop your PDF file here or click to browse"
                            description="PDF files only (Max 100MB)"
                        />
                    ) : (
                        <>
                            <FileInfo file={file} onRemove={handleReset} />

                            {pageInfo && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        📄 <strong>{pageInfo.totalPages}</strong> pages in this PDF
                                    </p>
                                </div>
                            )}

                            {!splitPDFs && pageInfo && (
                                <>
                                    {/* Split Mode Selection */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                            Split Method
                                        </label>
                                        <div className="space-y-3">
                                            {modes.map((mode) => (
                                                <button
                                                    key={mode.value}
                                                    onClick={() => setSplitMode(mode.value)}
                                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${splitMode === mode.value
                                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                                        }`}
                                                    disabled={isSplitting}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        {mode.label}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                                        {mode.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Input based on mode */}
                                    {splitMode === 'pages' && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Page Numbers
                                            </label>
                                            <input
                                                type="text"
                                                value={selectedPages}
                                                onChange={(e) => setSelectedPages(e.target.value)}
                                                placeholder="e.g., 1,3,5-7,10"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isSplitting}
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Separate page numbers with commas. Use hyphens for ranges (e.g., 1,3,5-7)
                                            </p>
                                        </div>
                                    )}

                                    {splitMode === 'ranges' && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                Page Ranges
                                            </label>
                                            <input
                                                type="text"
                                                value={ranges}
                                                onChange={(e) => setRanges(e.target.value)}
                                                placeholder="e.g., 1-5,6-10,11-15"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isSplitting}
                                            />
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Separate ranges with commas. Each range will become a separate PDF
                                            </p>
                                        </div>
                                    )}

                                    {splitMode === 'all' && (
                                        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                            <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                                ⚠️ This will create <strong>{pageInfo.totalPages}</strong> separate PDF files (one per page)
                                            </p>
                                        </div>
                                    )}

                                    {/* Split Button */}
                                    <div className="mt-6">
                                        <Button onClick={handleSplit} disabled={isSplitting} fullWidth>
                                            {isSplitting ? 'Splitting...' : 'Split PDF'}
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Progress */}
                            {isSplitting && (
                                <div className="mt-6">
                                    <ProgressBar progress={progress} />
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                    <p className="text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            {/* Results */}
                            {splitPDFs && (
                                <div className="mt-6 space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-green-900 dark:text-green-100">
                                                    Split Complete!
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Created {splitPDFs.files.length} PDF file(s)
                                                </p>
                                            </div>
                                            <div className="text-3xl">✅</div>
                                        </div>
                                    </div>

                                    {/* File List */}
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {splitPDFs.files.map((pdf, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl">📄</div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {pdf.filename}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                                            {pdf.pages} page(s) • {formatSize(pdf.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button onClick={() => handleDownload(pdf)} variant="secondary">
                                                    Download
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        {splitPDFs.files.length > 1 && (
                                            <Button onClick={handleDownloadAll} fullWidth>
                                                Download All ({splitPDFs.files.length})
                                            </Button>
                                        )}
                                        <Button onClick={handleReset} variant="secondary" fullWidth>
                                            Split Another PDF
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">✂️</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Flexible Splitting</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Split all pages, extract specific pages, or split by ranges
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">⚡</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Processing</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quick splitting with progress tracking for large PDFs
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All splitting happens in your browser. No uploads required
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                What's the difference between the split methods?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Split All Pages:</strong> Creates one PDF per page.
                                <strong> Extract Pages:</strong> Creates a single PDF with only selected pages.
                                <strong> Split by Ranges:</strong> Creates multiple PDFs based on page ranges you specify.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                How do I specify page numbers?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Use commas to separate individual pages (1,3,5) and hyphens for ranges (1-5).
                                You can combine both: "1,3,5-7,10" will select pages 1, 3, 5, 6, 7, and 10.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Can I split password-protected PDFs?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No, password-protected or encrypted PDFs cannot be split. You'll need to remove
                                the password protection first before using this tool.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Are my PDF files uploaded to a server?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                No! All PDF splitting happens locally in your browser. Your files never leave
                                your device, ensuring complete privacy and security.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFSplitter;
