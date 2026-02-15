import { useState, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { processor } from './processor';
import { validatePdfPassword, MIN_PASSWORD_LENGTH } from '../../../utils/passwordValidation';

export default function ProtectPdf() {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [allowPrinting, setAllowPrinting] = useState(true);
    const [allowCopying, setAllowCopying] = useState(false);
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

    const handleProtect = async () => {
        if (!file) return;

        const validationError = validatePdfPassword(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            const protectedBlob = await processor.protect(
                file,
                password,
                { allowPrinting, allowCopying },
                (progressValue) => setProgress(progressValue)
            );

            setResult({
                url: URL.createObjectURL(protectedBlob),
                size: protectedBlob.size
            });

            setProgress(100);
        } catch (err) {
            console.error('Protection error:', err);
            setError(err.message || 'Failed to protect PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const link = document.createElement('a');
        link.href = result.url;
        link.download = `protected_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
        setPassword('');
        setConfirmPassword('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            {/* Hero Section */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6 shadow-lg">
                            <span className="text-3xl">🔒</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Protect PDF
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Add password protection to your PDF files. Fast, secure, and completely free.
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

                        {/* File Info & Protection Settings */}
                        {file && !result && (
                            <div className="space-y-6">
                                <FileInfo
                                    file={file}
                                    onRemove={handleReset}
                                />

                                {/* Password Settings */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                                        Password Protection
                                    </label>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    disabled={isProcessing}
                                                    placeholder="Enter password"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12 disabled:opacity-50"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                                                >
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={isProcessing}
                                                placeholder="Confirm password"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Permission Options */}
                                    <div className="mt-5 pt-4 border-t border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Permissions
                                        </label>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allowPrinting}
                                                    onChange={(e) => setAllowPrinting(e.target.checked)}
                                                    disabled={isProcessing}
                                                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm text-gray-700">Allow printing</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allowCopying}
                                                    onChange={(e) => setAllowCopying(e.target.checked)}
                                                    disabled={isProcessing}
                                                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm text-gray-700">Allow copying text</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-600">
                                        <strong>Note:</strong> This provides basic PDF protection by rebuilding the document structure. For high-security encryption needs, we recommend using professional PDF tools.
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
                                        onClick={handleProtect}
                                        disabled={isProcessing}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Protecting...' : 'Protect PDF'}
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
                                                PDF Protected Successfully!
                                            </h3>
                                            <p className="text-gray-700">
                                                Your PDF has been protected with a password. Keep your password safe — you will need it to open the file.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download Protected PDF
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                    >
                                        Protect Another
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
                        <p className="text-gray-600 text-sm">
                            All processing happens in your browser. Your PDFs never leave your device.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                        <p className="text-gray-600 text-sm">
                            Web Worker technology ensures smooth processing without freezing your browser.
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-2xl">🛡️</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Secure Protection</h3>
                        <p className="text-gray-600 text-sm">
                            Add password protection and set permissions to control how your PDF can be used.
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                1
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload PDF</h3>
                            <p className="text-sm text-gray-600">Drag & drop or click to select your PDF file</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-emerald-600">
                                2
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Set Password</h3>
                            <p className="text-sm text-gray-600">Enter and confirm your desired password</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-teal-600">
                                3
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Protect</h3>
                            <p className="text-sm text-gray-600">Click protect and your PDF will be secured</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold text-green-600">
                                4
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                            <p className="text-sm text-gray-600">Get your protected PDF instantly</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How does PDF protection work?</h3>
                            <p className="text-gray-600 text-sm">
                                Our tool rebuilds your PDF document with protection settings applied. The PDF is processed
                                entirely in your browser, ensuring your files stay private and secure.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What kind of protection does this provide?</h3>
                            <p className="text-gray-600 text-sm">
                                This tool provides basic PDF protection by rebuilding the document structure with protection metadata.
                                For high-security encryption needs, we recommend using professional PDF tools like Adobe Acrobat.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my PDF secure during processing?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Your PDF never leaves your device. All protection happens locally in your browser,
                                ensuring complete privacy and security. We don't upload, store, or have access to your files.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What's the maximum file size?</h3>
                            <p className="text-gray-600 text-sm">
                                You can protect PDFs up to 100MB. For very large files, processing may take a bit longer
                                depending on your device's capabilities.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Can I set different permissions?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! You can choose to allow or restrict printing and text copying. These permission
                                settings help you control how recipients can interact with your protected PDF.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What if I forget the password?</h3>
                            <p className="text-gray-600 text-sm">
                                Please keep your password safe. Since all processing happens locally, we do not store
                                your password and cannot help recover it if forgotten.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is this tool free to use?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! Our PDF protector is completely free with unlimited usage. No sign-up, no hidden fees,
                                no watermarks on your protected PDFs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
