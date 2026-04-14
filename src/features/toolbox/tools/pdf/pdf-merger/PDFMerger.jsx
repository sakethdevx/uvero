import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import pdfMergerExecutor from './executor';

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
            const result = await pdfMergerExecutor.run({
                files: files.map((item) => item.file),
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });

            setMergedPDF(result);
        } catch (err) {
            setError(err.message || 'Merge failed');
        } finally {
            setIsMerging(false);
        }
    };

    const handleDownload = () => {
        if (!mergedPDF?.primaryFile) return;

        const url = URL.createObjectURL(mergedPDF.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = mergedPDF.primaryFile.name;
        link.click();
        URL.revokeObjectURL(url);
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
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!mergedPDF ? (
                        <>
                            {/* File List */}
                            {files.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            Selected PDFs ({files.length}/20)
                                        </h3>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Total: {formatSize(totalSize)}
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {files.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                            >
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                                                    {index + 1}.
                                                </span>
                                                <div className="text-3xl">📄</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {formatSize(item.file.size)}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0 || isMerging}
                                                        className="p-2 hover:bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Move up"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === files.length - 1 || isMerging}
                                                        className="p-2 hover:bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="Move down"
                                                    >
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFile(item.id)}
                                                        disabled={isMerging}
                                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded disabled:opacity-30"
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
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                                        Merging PDFs...
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                    <p className="text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Result */
                        <div className="space-y-4">
                            <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100 text-lg mb-1">
                                            PDFs Merged Successfully!
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            {mergedPDF.primaryFile.name} • {formatSize(mergedPDF.meta?.outputSize || mergedPDF.primaryFile.size)}
                                        </p>
                                    </div>
                                    <div className="text-4xl">✅</div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="text-gray-600 dark:text-gray-300">Files Merged</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {files.length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="text-gray-600 dark:text-gray-300">Total Pages</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {mergedPDF.meta?.totalPages}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="text-gray-600 dark:text-gray-300">File Size</p>
                                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {formatSize(mergedPDF.meta?.outputSize || mergedPDF.primaryFile.size)}
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
        </div>
    );
};

export default PDFMerger;
