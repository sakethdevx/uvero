import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const LANGUAGES = [
    { value: 'eng', label: 'English' },
    { value: 'spa', label: 'Spanish' },
    { value: 'fra', label: 'French' },
    { value: 'deu', label: 'German' },
    { value: 'ita', label: 'Italian' },
    { value: 'por', label: 'Portuguese' },
    { value: 'chi_sim', label: 'Chinese' },
    { value: 'jpn', label: 'Japanese' },
    { value: 'kor', label: 'Korean' },
];

export default function OcrPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState('eng');
    const fileInputRef = useRef(null);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setProgress(0);
    };

    const handleProcess = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const ocrResult = await processor.processOCR(
                file,
                language,
                (progressValue) => setProgress(progressValue)
            );

            setResult(ocrResult);
            setProgress(100);
        } catch (err) {
            console.error('OCR error:', err);
            setError(err.message || 'Failed to process PDF. Please try again.');
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-sky-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔍</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            OCR PDF
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Extract text from PDFs and make them searchable. Fast, secure, and completely free.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
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
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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

                        {/* File Info & Language Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Language Selector */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                                        Document Language
                                    </label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <option key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-3 text-xs text-gray-600">
                                        <strong>Note:</strong> Text extraction works best on PDFs that already contain embedded text. For scanned image-only PDFs, results may be limited.
                                    </div>
                                </div>

                                {/* Progress */}
                                {isProcessing && (
                                    <ProgressBar progress={progress} />
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Processing...' : 'Extract Text & Make Searchable'}
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
                                {/* Success Message */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                PDF Processed Successfully!
                                            </h3>
                                            <p className="text-gray-700 mb-4">
                                                Extracted text from <span className="font-bold text-green-700">{result.totalPages} page{result.totalPages !== 1 ? 's' : ''}</span>
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 mb-1">Pages Processed</div>
                                                    <div className="font-semibold text-gray-900">{result.totalPages}</div>
                                                </div>
                                                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-100">
                                                    <div className="text-gray-600 mb-1">File Size</div>
                                                    <div className="font-semibold text-green-700">{formatFileSize(result.blob.size)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Extracted Text Preview */}
                                {result.extractedText && (
                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Extracted Text Preview</h4>
                                        <pre className="text-sm text-gray-600 whitespace-pre-wrap break-words max-h-48 overflow-y-auto bg-white rounded-lg p-4 border border-gray-100">
                                            {result.extractedText.slice(0, 500)}
                                            {result.extractedText.length > 500 && '...'}
                                        </pre>
                                    </div>
                                )}

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Searchable PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Process Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                        <p className="text-gray-600 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fast Processing</h3>
                        <p className="text-gray-600 text-sm">
                            Extract text from PDFs quickly using advanced browser-based processing.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🌐</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Multi-Language</h3>
                        <p className="text-gray-600 text-sm">
                            Support for multiple languages including English, Spanish, French, and more.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-cyan-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-sky-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Select Language</h3>
                            <p className="text-sm text-gray-600">Choose the language of your document</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-blue-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Extract Text</h3>
                            <p className="text-sm text-gray-600">Text is extracted and the PDF is made searchable</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                            <p className="text-sm text-gray-600">Get your searchable PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What is OCR PDF?</h3>
                            <p className="text-gray-600 text-sm">
                                OCR (Optical Character Recognition) extracts text from PDF documents, making them searchable and selectable.
                                This tool processes your PDF to identify and extract text content from each page.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What types of PDFs work best?</h3>
                            <p className="text-gray-600 text-sm">
                                This tool works best with PDFs that contain embedded text layers. For scanned image-only PDFs,
                                the text extraction may be limited. Digital PDFs created from word processors yield the best results.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Your PDF never leaves your device. All processing happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What languages are supported?</h3>
                            <p className="text-gray-600 text-sm">
                                We support English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, and Korean.
                                Select the appropriate language before processing for the best results.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 text-sm">
                                You can process PDFs up to 100MB. Larger documents with many pages may take longer to process.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I extract text from scanned documents?</h3>
                            <p className="text-gray-600 text-sm">
                                This tool extracts existing text layers from PDFs. For pure scanned images without any text layer,
                                the extraction will be limited. Best results come from digitally-created PDFs or PDFs with existing text content.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How long does processing take?</h3>
                            <p className="text-gray-600 text-sm">
                                Processing time depends on file size and number of pages. Most documents process in 5-30 seconds.
                                Larger files with many pages may take 1-2 minutes.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our OCR PDF tool is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your processed PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
