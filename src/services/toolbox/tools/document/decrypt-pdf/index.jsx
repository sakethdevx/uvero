import { useState, useCallback } from 'react';
import { usePdfUnlock } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';

export const metadata = {
    id: 'decrypt-pdf',
    name: 'Unlock PDF',
    category: 'document',
    keywords: ['unlock', 'decrypt', 'password', 'security', 'pdf'],
    icon: '🔓',
    offline: true,
    experimental: false
};

export default function DecryptPdfTool() {
    const [files, setFiles] = useState([]);
    const [password, setPassword] = useState('');

    const { unlock, cancel, reset, isProcessing, progress, progressMessage, error, result } = usePdfUnlock();

    const handleFileSelect = useCallback((newFile) => {
        setFiles((prev) => {
            // Prevent duplicates based on name and size
            const isDuplicate = prev.some(f => f.name === newFile.name && f.size === newFile.size);
            if (isDuplicate) return prev;
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, newFile];
        });
    }, []);

    const handleRemove = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        if (result) reset();
    };

    const handleUnlock = () => {
        unlock(files, { password });
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleReset = () => {
        setFiles([]);
        setPassword('');
        reset();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drag & drop an encrypted PDF file here or click to browse"
                />
            )}

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-lg">Unlock PDF ({files.length} file)</h3>
                        <p className="text-sm text-gray-500">Only one file can be processed at a time</p>
                    </div>

                    <div className="space-y-4">
                        {/* Password Input */}
                        <div className="space-y-2">
                            <p className="font-medium">Password</p>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter password to unlock PDF"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isProcessing}
                                />
                                {isProcessing ? (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-sm">
                                        <svg className="w-4 h-4 text-gray-500 animate-spin" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.736-2m0 0a8.003 8.003 0 0014.736 2m0 0A4.001 4.001 0 0115.758 8M15.758 8a4.001 4.001 0 00-5.657 0M15.758 8A4.001 4.001 0 0111.242 4m0 0a4.001 4.001 0 015.657 0M5.657 4a4.001 4.001 0 00-5.657 0M5.657 4a4.001 4.001 0 015.657 0" />
                                        </svg>
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Password is required to unlock the PDF
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                <p className="font-medium">Unlock Error</p>
                                <p>{error.message}</p>
                            </div>
                        )}

                        {isProcessing ? (
                            <div className="space-y-4">
                                <ProgressBar progress={progress} />
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>{progressMessage}</p>
                                    <Button onClick={cancel} variant="outline" className="text-red-500 border-red-200">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setFiles([])} variant="outline">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleUnlock}
                                    disabled={files.length === 0 || password.trim() === ''}
                                    className={
                                        (files.length === 0 || password.trim() === '') 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : ''
                                    }
                                >
                                    Unlock PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-green-200 dark:border-green-800 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">PDF Unlocked Successfully!</h2>
                        <p className="text-gray-500">
                            The PDF has been decrypted and is now accessible without password protection.
                        </p>
                        {result.metadata?.wasEncrypted && (
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                                Successfully unlocked encrypted PDF with {result.metadata.pageCount} pages.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleReset} variant="outline">
                            Start Over
                        </Button>
                        <Button
                            onClick={() => {
                                const url = URL.createObjectURL(result.blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = result.filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Download Unlocked PDF
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
