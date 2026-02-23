import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { processor } from './processor';

const PDFMerger = () => {
    const [files, setFiles] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mergedPDF, setMergedPDF] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (selectedFile) => {
        setFiles(prevFiles => {
            if (prevFiles.length >= 20) {
                setError('Maximum 20 PDFs allowed');
                return prevFiles;
            }
            setError('');
            return [...prevFiles, { id: Date.now() + Math.random(), file: selectedFile }];
        });
    };

    const handleRemoveFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
        setMergedPDF(null);
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newFiles = [...files];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        setFiles(newFiles);
    };

    const handleMoveDown = (index) => {
        if (index === files.length - 1) return;
        const newFiles = [...files];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        setFiles(newFiles);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Please add at least 2 PDF files to merge');
            return;
        }

        setIsMerging(true);
        setError('');
        setProgress(0);

        try {
            const result = await processor.merge(
                files.map(f => f.file),
                (progressValue) => setProgress(progressValue)
            );

            setMergedPDF(result);
        } catch (err) {
            setError(err.message || 'Merge failed');
        } finally {
            setIsMerging(false);
        }
    };

    const handleDownload = () => {
        if (!mergedPDF) return;

        const link = document.createElement('a');
        link.href = mergedPDF.url;
        link.download = mergedPDF.filename;
        link.click();
    };

    const handleReset = () => {
        setFiles([]);
        setMergedPDF(null);
        setError('');
        setProgress(0);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        PDF Merger
                    </h1>
                    <p className="text-lg text-gray-600">
                        Combine multiple PDF files into a single document
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    {!mergedPDF ? (
                        <>
                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">
                                            Selected PDFs ({files.length}/20)
                                        </h3>
                                        <span className="text-sm text-gray-600">
                                            Total: {formatSize(totalSize)}
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {files.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <span className="text-sm font-medium text-gray-500 w-8">
                                                    {index + 1}.
                                                </span>
                                                <div className="text-3xl">📄</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatSize(item.file.size)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0 || isMerging}
                                                        className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Move up"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === files.length - 1 || isMerging}
                                                        className="p-2 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Move down"
                                                    >
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFile(item.id)}
                                                        disabled={isMerging}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                                                        title="Remove"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dropzone */}
                            {files.length < 20 && (
                                <Dropzone
                                    onFileSelect={handleFileSelect}
                                    accept="application/pdf,.pdf"
                                    maxSize={100 * 1024 * 1024}
                                    multiple={true}
                                    label={files.length === 0 ? "Drop your PDF files here or click to browse" : "Add more PDFs"}
                                    description={`PDF files only (Max 100MB per file, ${20 - files.length} slots remaining)`}
                                />
                            )}

                            {/* Merge Button */}
                            {files.length >= 2 && !isMerging && (
                                <div className="mt-6">
                                    <Button onClick={handleMerge} fullWidth>
                                        Merge {files.length} PDFs
                                    </Button>
                                </div>
                            )}

                            {/* Progress */}
                            {isMerging && (
                                <div className="mt-6">
                                    <ProgressBar progress={progress} />
                                    <p className="text-center text-sm text-gray-600 mt-2">
                                        Merging PDFs...
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800">{error}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Result */
                        <div className="space-y-4">
                            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-semibold text-green-900 text-lg mb-1">
                                            PDFs Merged Successfully!
                                        </p>
                                        <p className="text-sm text-green-700">
                                            {mergedPDF.filename} • {formatSize(mergedPDF.size)}
                                        </p>
                                    </div>
                                    <div className="text-4xl">✅</div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="p-3 bg-white rounded-lg">
                                        <p className="text-gray-600">Files Merged</p>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {files.length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg">
                                        <p className="text-gray-600">Total Pages</p>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {mergedPDF.totalPages}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg">
                                        <p className="text-gray-600">File Size</p>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {formatSize(mergedPDF.size)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button onClick={handleDownload} fullWidth>
                                    Download Merged PDF
                                </Button>
                                <Button onClick={handleReset} variant="secondary" fullWidth>
                                    Merge More PDFs
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">📑</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Unlimited Pages</h3>
                        <p className="text-gray-600 text-sm">
                            Merge up to 20 PDF files with any number of pages
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔄</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Custom Order</h3>
                        <p className="text-gray-600 text-sm">
                            Reorder files before merging with simple arrow buttons
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="text-3xl mb-3">🔒</div>
                        <h3 className="font-semibold text-gray-900 mb-2">100% Secure</h3>
                        <p className="text-gray-600 text-sm">
                            All merging happens in your browser. Files never uploaded
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                How many PDFs can I merge at once?
                            </h3>
                            <p className="text-gray-600">
                                You can merge up to 20 PDF files in a single operation. Each file
                                can be up to 100MB in size.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Can I change the order of the PDFs?
                            </h3>
                            <p className="text-gray-600">
                                Yes! Use the up (↑) and down (↓) arrow buttons next to each file to
                                reorder them before merging. The order you arrange will be the order
                                in the final merged PDF.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Will the merged PDF preserve bookmarks and links?
                            </h3>
                            <p className="text-gray-600">
                                The tool preserves the content and pages of your PDFs. However,
                                internal bookmarks and links may not be preserved during the merge process.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Are my PDF files uploaded to a server?
                            </h3>
                            <p className="text-gray-600">
                                No! All PDF merging happens locally in your browser using Web APIs.
                                Your files never leave your device, ensuring complete privacy and security.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFMerger;
