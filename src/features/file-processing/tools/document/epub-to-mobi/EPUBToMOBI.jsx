import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';

/**
 * EPUB to MOBI Converter
 * Note: Full MOBI conversion requires server-side processing
 * This provides information and basic file handling
 */
export default function EPUBToMOBI() {
    const [file, setFile] = useState(null);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
    };

    const handleReset = () => {
        setFile(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📚 EPUB to MOBI Converter
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Convert EPUB ebooks to MOBI format for Kindle devices
                    </p>
                </div>

                {!file && (
                    <>
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".epub,application/epub+zip"
                            maxSize={50}
                        />

                        {/* Features */}
                        <div className="mt-8 grid md:grid-cols-3 gap-4">
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📱</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Kindle Compatible
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Convert ebooks for Kindle devices
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🔒</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Secure Processing
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Your files are processed securely
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Fast Conversion
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Quick EPUB to MOBI conversion
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {file && (
                    <div className="space-y-4">
                        <FileInfo file={file} onRemove={() => setFile(null)} />

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="text-3xl">ℹ️</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Online Conversion Required
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        MOBI conversion requires specialized server-side processing. 
                                        Switch to <strong>Online Mode</strong> to enable this conversion.
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Alternatively, you can use tools like Calibre (a free desktop application) 
                                        for EPUB to MOBI conversion with advanced options.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => alert('Please switch to Online Mode or use Calibre for MOBI conversion')}
                                variant="primary"
                                className="flex-1"
                            >
                                Convert to MOBI (Online Mode Required)
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About EPUB to MOBI Conversion</h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <p>
                            <strong>MOBI</strong> is the ebook format used by Amazon Kindle devices and apps.
                        </p>
                        <p>
                            Converting EPUB to MOBI allows you to read your ebooks on Kindle devices, 
                            which don't natively support EPUB format.
                        </p>
                        <p className="mt-4">
                            <strong>Note:</strong> For offline MOBI conversion, we recommend using:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Calibre (Free desktop application)</li>
                            <li>Amazon's Send to Kindle service (for personal documents)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
