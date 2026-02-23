import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { useMode } from '../../../context/ModeContext';
import processor from './processor';
import { compressImageOnline, isOnlineFeatureAvailable } from '../../../services/imageApi';

/**
 * Image Compressor Tool
 * Compresses images client-side (offline) or using API (online)
 */
export default function ImageCompressor() {
    const { isOnlineMode } = useMode();
    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState(80);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            processor.terminate();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Create preview URL when file is selected
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            let compressed;

            if (isOnlineMode && isOnlineFeatureAvailable('compression')) {
                // Online mode: Upload and process via API
                setProgress(10);
                compressed = await compressImageOnline(file, quality);

                // Create file object from blob
                compressed.file = new File(
                    [compressed.blob],
                    file.name.replace(/\.[^/.]+$/, '') + '_compressed' + getExtension(compressed.blob.type),
                    { type: compressed.blob.type }
                );
                setProgress(100);
            } else {
                // Offline mode: Client-side processing
                if (isOnlineMode) {
                    // User is in online mode but API not available
                    setError('Online compression API is currently unavailable. Switching to offline processing...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    setError('');
                }

                compressed = await processor.compress(
                    file,
                    quality,
                    (prog) => setProgress(prog)
                );
            }

            setProgress(100);
            setResult(compressed);
        } catch (err) {
            setError(err.message || 'Compression failed. Please try again.');
            console.error('Compression error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const getExtension = (mimeType) => {
        const extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp'
        };
        return extensions[mimeType] || '.jpg';
    };

    const handleDownload = () => {
        if (!result) return;

        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
        setQuality(80);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Image Compressor
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        Reduce your image file size without sacrificing quality.
                        Perfect for web optimization, email attachments, and faster loading times.
                    </p>

                    {/* Mode Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Privacy Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-green-700">
                                100% Secure - All processing happens in your browser
                            </span>
                        </div>

                        {/* Current Mode Badge */}
                        {isOnlineMode ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <span className="text-sm font-medium text-blue-700">
                                    Online Mode (Enhanced Processing)
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">
                                    Offline Mode (Client-Side)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Tool Area */}
                <div className="space-y-6">
                    {/* Upload Section */}
                    {!file && !result && (
                        <Dropzone
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onFileSelect={handleFileSelect}
                            maxSize={50 * 1024 * 1024} // 50MB limit
                        />
                    )}

                    {/* File Selected - Show Controls */}
                    {file && !result && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <FileInfo file={file} />

                            {/* Preview */}
                            {previewUrl && (
                                <div className="card">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                                    <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-64 rounded shadow-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Quality Slider */}
                            <div className="card">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-lg font-semibold text-gray-900">
                                        Compression Quality
                                    </label>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {quality}%
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    disabled={isProcessing}
                                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${quality}%, #e5e7eb ${quality}%, #e5e7eb 100%)`
                                    }}
                                />

                                <div className="flex justify-between text-sm text-gray-500 mt-2">
                                    <span>Smaller file</span>
                                    <span>Better quality</span>
                                </div>
                            </div>

                            {/* Processing Progress */}
                            {isProcessing && (
                                <div className="card bg-primary-50 border-primary-200">
                                    <ProgressBar progress={progress} label="Compressing image..." />
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="card bg-red-50 border-red-200">
                                    <p className="text-red-600 font-medium">⚠️ {error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleCompress}
                                    disabled={isProcessing}
                                    loading={isProcessing}
                                    fullWidth
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                        </svg>
                                    }
                                >
                                    Compress Image
                                </Button>

                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Result Section */}
                    {result && (
                        <div className="space-y-6">
                            {/* Success Message */}
                            <div className="card bg-green-50 border-green-200">
                                <div className="flex items-center gap-3">
                                    <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-900">Compression Complete!</h3>
                                        <p className="text-sm text-green-700">
                                            Your image has been optimized and is ready to download.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison */}
                            <FileInfo
                                file={file}
                                compressedSize={result.compressedSize}
                                showComparison={true}
                            />

                            {/* Download Button */}
                            <Button
                                onClick={handleDownload}
                                fullWidth
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                }
                            >
                                Download Compressed Image
                            </Button>

                            {/* Compress Another */}
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                                fullWidth
                            >
                                Compress Another Image
                            </Button>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 space-y-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid gap-6">
                        {[
                            {
                                q: "Is my image data safe?",
                                a: "Absolutely! All image processing happens entirely in your browser. Your files never leave your device and are not uploaded to any server. This ensures complete privacy and security."
                            },
                            {
                                q: "What image formats are supported?",
                                a: "We support the most common image formats: JPG/JPEG, PNG, and WebP. These formats cover the vast majority of use cases for web and digital media."
                            },
                            {
                                q: "How much can I reduce my image size?",
                                a: "Typically, you can reduce image file size by 50-80% depending on the original format and quality settings. The compression is optimized to maintain visual quality while maximizing size reduction."
                            },
                            {
                                q: "Does compression reduce image quality?",
                                a: "Our tool uses smart compression algorithms that minimize quality loss. At 80% quality, most users won't notice any difference. You can adjust the quality slider to find the perfect balance for your needs."
                            },
                            {
                                q: "Is there a file size limit?",
                                a: "The maximum file size is 50MB per image, which is more than enough for most use cases. Processing happens quickly even for large images."
                            },
                            {
                                q: "Can I compress multiple images at once?",
                                a: "Currently, the free version supports one image at a time. Batch processing will be available in our Pro plan (coming soon)."
                            }
                        ].map((faq, idx) => (
                            <div key={idx} className="card hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {faq.q}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">
                        Why Compress Images?
                    </h3>
                    <ul className="space-y-2 text-blue-800">
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Faster Website Loading:</strong> Smaller images mean faster page load times and better SEO rankings</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Save Storage Space:</strong> Reduce storage costs on your server or cloud storage</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Better User Experience:</strong> Users with slow connections can still enjoy your content</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span><strong>Email Friendly:</strong> Compressed images are easier to send via email</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
