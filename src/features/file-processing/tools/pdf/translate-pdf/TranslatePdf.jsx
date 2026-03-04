import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'ar', label: 'Arabic' },
    { code: 'ru', label: 'Russian' },
    { code: 'hi', label: 'Hindi' },
    { code: 'nl', label: 'Dutch' },
    { code: 'sv', label: 'Swedish' },
    { code: 'pl', label: 'Polish' },
];

export default function TranslatePdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
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

    const handleTranslate = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const output = await processor.translate(
                file,
                sourceLang,
                targetLang,
                (progressValue) => setProgress(progressValue)
            );

            setResult(output);
            setProgress(100);
        } catch (err) {
            console.error('Translation error:', err);
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

    const getLangLabel = (code) => {
        const lang = LANGUAGES.find(l => l.code === code);
        return lang ? lang.label : code;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-fuchsia-50">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-fuchsia-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🌐</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            PDF Translator
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                            Extract and translate text from PDF documents. Fast, secure, and completely free.
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
                                icon="🌐"
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
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                        Translation Settings
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Source Language</label>
                                            <select
                                                value={sourceLang}
                                                onChange={(e) => setSourceLang(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Target Language</label>
                                            <select
                                                value={targetLang}
                                                onChange={(e) => setTargetLang(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                                        <strong>Note:</strong> This tool extracts text from your PDF and prepares it for translation. For best results with actual language translation, an online translation service is recommended.
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
                                        onClick={handleTranslate}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Translating...' : 'Translate PDF'}
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
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                PDF Processed Successfully!
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-200 mb-4">
                                                Extracted text from <span className="font-bold text-green-700">{result.totalPages} page{result.totalPages !== 1 ? 's' : ''}</span> ({getLangLabel(sourceLang)} → {getLangLabel(targetLang)})
                                            </p>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                For best translation results, use the extracted text below with an online translation service.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Extracted Text Preview */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                        Extracted Text
                                    </label>
                                    <textarea
                                        readOnly
                                        value={result.extractedText}
                                        rows={8}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono resize-y focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    />
                                </div>

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Translated PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Translate Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-fuchsia-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🌍</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">15 Languages</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Support for 15 popular languages including English, Spanish, French, German, and more.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">📄</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Text Extraction</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Accurately extracts text from PDF documents while preserving the original layout.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-pink-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-fuchsia-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Select Languages</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Choose your source and target languages</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-purple-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Translate</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Click translate and the text will be extracted and processed</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Download</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Get your translated PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How does PDF translation work?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Our tool extracts text from your PDF document using advanced text recognition technology.
                                The extracted text is then prepared for translation while preserving the document structure.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Which languages are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                We support 15 popular languages: English, Spanish, French, German, Italian, Portuguese,
                                Chinese, Japanese, Korean, Arabic, Russian, Hindi, Dutch, Swedish, and Polish.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is my PDF secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Your PDF never leaves your device. All processing happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                You can translate PDFs up to 100MB. For very large files, processing may take a bit longer
                                depending on the number of pages.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will translation affect PDF layout?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                The tool preserves the original PDF layout as much as possible. The extracted text is available
                                for review, and the output PDF maintains the original document structure.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I translate scanned PDFs?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                This tool works best with text-based PDFs. For scanned documents, consider using our OCR tool
                                first to extract the text, then use this translator.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How accurate is the translation?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Text extraction is highly accurate for text-based PDFs. For the best translation quality,
                                we recommend reviewing the extracted text and using a professional translation service for
                                critical documents.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! Our PDF translator is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your translated PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
