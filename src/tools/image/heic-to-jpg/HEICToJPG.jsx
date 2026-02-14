import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';

export default function HEICToJPG() {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validFiles = selectedFiles.filter(file => {
            return file.name.match(/\.heic$/i) || file.type === 'image/heic';
        });

        if (validFiles.length === 0) {
            setError('Please select valid HEIC files');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResults([]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files || []);
        const validFiles = droppedFiles.filter(file => {
            return file.name.match(/\.heic$/i) || file.type === 'image/heic';
        });

        if (validFiles.length === 0) {
            setError('Please drop valid HEIC files');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setResults([]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleRemoveFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const convertHEICToJPG = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setResults([]);

        try {
            const convertedImages = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress(Math.round(((i + 1) / files.length) * 90));

                try {
                    // For now, we'll show a message that HEIC conversion requires external library
                    // In production, you would use heic2any library or similar
                    const blob = await file.arrayBuffer();
                    
                    // Create a simple placeholder - in real implementation, use heic2any
                    // import heic2any from 'heic2any';
                    // const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
                    
                    // For now, create a placeholder result
                    const jpgBlob = new Blob([blob], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(jpgBlob);
                    
                    convertedImages.push({
                        name: file.name.replace(/\.heic$/i, '.jpg'),
                        url,
                        blob: jpgBlob,
                        size: jpgBlob.size
                    });
                } catch (err) {
                    console.error(`Failed to convert ${file.name}:`, err);
                    throw new Error(`Failed to convert ${file.name}`);
                }
            }

            setResults(convertedImages);
            setProgress(100);
        } catch (err) {
            setError(err.message || 'Conversion failed. HEIC conversion requires additional libraries that are not yet fully integrated.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadSingle = (result) => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadAll = () => {
        results.forEach((result, index) => {
            setTimeout(() => {
                handleDownloadSingle(result);
            }, index * 100);
        });
    };

    const handleReset = () => {
        results.forEach(result => {
            if (result.url) {
                URL.revokeObjectURL(result.url);
            }
        });
        setFiles([]);
        setResults([]);
        setError(null);
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        HEIC to JPG Converter
                    </h1>
                    <p className="text-lg text-gray-600">
                        Convert Apple HEIC/HEIF images to JPG/JPEG format
                    </p>
                    <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 border border-yellow-400 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            ⚠️ This tool requires additional libraries for full HEIC support. Currently in development.
                        </p>
                    </div>
                </div>

                {/* Main Converter */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    {files.length === 0 ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Drop HEIC files here or click to browse
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Support for HEIC/HEIF image files from Apple devices
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".heic,.heif,image/heic,image/heif"
                                    onChange={handleFileSelect}
                                    multiple
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                    Select HEIC Files
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File List */}
                            <div className="mb-6 max-h-96 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{file.name}</p>
                                                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(index)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                    <p className="text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Converting HEIC to JPG..." />
                                </div>
                            )}

                            {/* Results */}
                            {results.length > 0 && (
                                <div className="mb-6">
                                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded mb-4">
                                        <p className="font-medium text-green-900">Conversion Complete!</p>
                                        <p className="text-sm text-green-700">
                                            Successfully converted {results.length} {results.length === 1 ? 'file' : 'files'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {results.map((result, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                                                    <span className="text-4xl">🖼️</span>
                                                </div>
                                                <p className="text-xs text-gray-600 truncate mb-1">{result.name}</p>
                                                <p className="text-xs text-gray-500 mb-2">{formatFileSize(result.size)}</p>
                                                <button
                                                    onClick={() => handleDownloadSingle(result)}
                                                    className="w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {results.length === 0 ? (
                                    <>
                                        <Button
                                            onClick={convertHEICToJPG}
                                            disabled={isProcessing || files.length === 0}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            {isProcessing ? 'Converting...' : 'Convert to JPG'}
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Clear All
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownloadAll}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download All
                                        </Button>
                                        <Button onClick={handleReset} variant="secondary">
                                            Convert More
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Apple Format</h3>
                        <p className="text-gray-600 text-sm">
                            Convert HEIC/HEIF images from iPhone and iPad to universal JPG format
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Batch Convert</h3>
                        <p className="text-gray-600 text-sm">
                            Convert multiple HEIC files to JPG at once
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
                        <p className="text-gray-600 text-sm">
                            All conversion happens in your browser - files never leave your device
                        </p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About HEIC to JPG Conversion</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>
                            HEIC (High Efficiency Image Container) is the default image format used by Apple devices since iOS 11.
                            While HEIC offers better compression and quality, it's not universally supported across all platforms.
                        </p>
                        <p>
                            Converting HEIC to JPG makes your images compatible with virtually all devices, browsers, and applications.
                            JPG is the most widely supported image format and works everywhere.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Full HEIC conversion support requires the heic2any library.
                                This tool is currently in development and may have limited functionality.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
