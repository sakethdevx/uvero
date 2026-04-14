import { useEffect, useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';
import ProgressBar from '../../../shared/ProgressBar';
import epubToMobiExecutor from './executor';
import { getToolMetadata } from '../../../core/toolMetadata';

/**
 * EPUB to MOBI Converter
 * Note: Full MOBI conversion requires server-side processing
 * This provides information and basic file handling
 */
export default function EPUBToMOBI() {
    const tool = getToolMetadata('epub-to-mobi');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [runtimeStatus, setRuntimeStatus] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadRuntimeStatus = async () => {
            try {
                const response = await fetch('/api/file-tools/runtime-status');
                if (!response.ok) {
                    throw new Error('Failed to load runtime status.');
                }

                const data = await response.json();
                if (!cancelled) {
                    setRuntimeStatus(data.tools?.['epub-to-mobi'] || null);
                }
            } catch {
                if (!cancelled) {
                    setRuntimeStatus(null);
                }
            } finally {
                if (!cancelled) {
                    setIsCheckingStatus(false);
                }
            }
        };

        loadRuntimeStatus();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
        setResult(null);
        setProgress(0);
    };

    const handleReset = () => {
        setFile(null);
        setError('');
        setResult(null);
        setProgress(0);
    };

    const handleConvert = async () => {
        if (!file || runtimeStatus?.available === false) return;

        setIsProcessing(true);
        setError('');
        setResult(null);
        setProgress(0);

        try {
            const conversionResult = await epubToMobiExecutor.run({
                files: [file],
                mode: 'online',
                onProgress: (value) => setProgress(value),
            });
            setResult(conversionResult);
        } catch (err) {
            setError(err.message || 'EPUB to MOBI conversion is not available right now.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.primaryFile) return;

        const url = URL.createObjectURL(result.primaryFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.primaryFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const availabilityNote = runtimeStatus?.note || tool?.availabilityNote;
    const limits = runtimeStatus?.limits || tool?.limits || [];
    const isRuntimeUnavailable = runtimeStatus?.available === false;

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
                                <div className="text-3xl mb-2">☁️</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Online-Only Route
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    This tool appears only in online mode
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">🧩</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Server API Ready
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Conversion runs through a real online API when this deployment provides a MOBI runtime
                                </p>
                            </div>
                            <div className="text-center p-4">
                                <div className="text-3xl mb-2">📚</div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Kindle Guidance
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Use Calibre or Send to Kindle until the backend is enabled
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
                                        Server Conversion Runtime Required
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                        {availabilityNote}
                                    </p>
                                    {limits.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {limits.map((limit) => (
                                                <span
                                                    key={limit}
                                                    className="inline-flex rounded-full border border-blue-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-200"
                                                >
                                                    {limit}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {runtimeStatus?.runtime && (
                                        <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                                            Active runtime: <strong>{runtimeStatus.runtime}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isProcessing && (
                            <ProgressBar progress={progress} />
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {!error && isRuntimeUnavailable && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                                <p className="text-amber-900 dark:text-amber-200 text-sm">
                                    This deployment is missing the configured MOBI runtime. Conversion is disabled until the server runtime is provisioned.
                                </p>
                            </div>
                        )}

                        {result?.primaryFile && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                                <p className="text-green-800 dark:text-green-200 font-medium">Conversion complete</p>
                                <p className="text-green-700 dark:text-green-300 text-sm">
                                    {result.primaryFile.name}
                                    {result.meta?.note ? ` • ${result.meta.note}` : ''}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {!result ? (
                                <>
                                    <Button
                                        onClick={handleConvert}
                                        variant="primary"
                                        className="flex-1"
                                        disabled={isProcessing || isCheckingStatus || isRuntimeUnavailable}
                                    >
                                        {isCheckingStatus ? 'Checking Runtime...' : isProcessing ? 'Converting...' : 'Convert to MOBI'}
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
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        Download MOBI
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

                {/* Info Section */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">About EPUB to MOBI Conversion</h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        <p>
                            <strong>MOBI</strong> is the ebook format used by Amazon Kindle devices and apps.
                        </p>
                        <p>
                            This tool now calls a real online conversion API. The deployment still needs a server-side converter runtime configured before EPUB uploads can be turned into MOBI files.
                        </p>
                        <p className="mt-4">
                            <strong>Fallback options:</strong> If the runtime is not configured here yet, we recommend:
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
