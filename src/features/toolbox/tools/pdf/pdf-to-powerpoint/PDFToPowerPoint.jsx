import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import pdfToPowerPointExecutor from './executor';

const PDFToPowerPoint = () => {
    const [file, setFile] = useState(null);
    const [converting, setConverting] = useState(false);
    const [convertedDoc, setConvertedDoc] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                setError('Please select a valid PDF file');
                return;
            }

            setFile(selectedFile);
            setError('');
            setConvertedDoc(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (droppedFile.type !== 'application/pdf') {
                setError('Please drop a valid PDF file');
                return;
            }

            setFile(droppedFile);
            setError('');
            setConvertedDoc(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const convertToPowerPoint = async () => {
        if (!file) return;

        setConverting(true);
        setError('');
        setProgress(0);

        try {
            const result = await pdfToPowerPointExecutor.run({
                files: [file],
                mode: 'offline',
                onProgress: (progressValue) => setProgress(progressValue),
            });
            setConvertedDoc(result);
            setProgress(100);
        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to convert PDF. Please try again.');
        } finally {
            setConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedDoc?.primaryFile) return;

        const url = URL.createObjectURL(convertedDoc.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedDoc.primaryFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setConvertedDoc(null);
        setError('');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        PDF to PowerPoint Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert PDF documents to Microsoft PowerPoint format (PPTX)
                    </p>
                </div>

                {/* Main Converter */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-orange-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Drop PDF file here or click to browse
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Supports PDF format
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                                    Select PDF File
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File Info */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{file.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {converting && progress > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Converting...</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-orange-600 to-red-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {!convertedDoc ? (
                                    <>
                                        <Button
                                            onClick={convertToPowerPoint}
                                            disabled={converting}
                                            className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                                        >
                                            {converting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Converting...
                                                </span>
                                            ) : (
                                                'Convert to PowerPoint'
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download PowerPoint
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="secondary"
                                        >
                                            Convert Another
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Text to Slides</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Converts PDF content into editable PowerPoint slides
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Conversion</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quick and efficient conversion process for your presentations
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Your documents remain private and are never uploaded to servers
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I convert PDF to PowerPoint?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Simply drag and drop your PDF document into the converter, or click to browse and select your file. Then click "Convert to PowerPoint" and download the result in PPTX format.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is the conversion secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! All conversions happen locally in your browser. Your documents are never uploaded to any server, ensuring complete privacy.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What happens to my formatting?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                The converter extracts text content from your PDF and creates PowerPoint slides. Each page becomes a separate slide with the extracted text. Complex layouts and images may require manual adjustment in PowerPoint.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I edit the PowerPoint after conversion?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! The converted file is a fully editable PPTX file that can be opened and modified in Microsoft PowerPoint, Google Slides, LibreOffice Impress, and other compatible presentation software.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFToPowerPoint;
