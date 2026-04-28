import { useState } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import FileInfo from '../../../shared/FileInfo';
import ProgressBar from '../../../shared/ProgressBar';
import epubToMobiExecutor from './executor';
import useToolRuntimeStatus from '../../../core/useToolRuntimeStatus';

/**
 * EPUB to MOBI Converter
 * Note: Full MOBI conversion requires server-side processing
 * This provides information and basic file handling
 */
export default function EPUBToMOBI({ toolRuntimeStatus }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const localRuntimeStatus = useToolRuntimeStatus('epub-to-mobi', {
        enabled: !toolRuntimeStatus,
    });
    const {
        isLoading: isCheckingStatus,
        isAvailable: isRuntimeAvailable,
        hasVerificationFailure,
        runtime,
    } = toolRuntimeStatus || localRuntimeStatus;

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
        if (!file || !isRuntimeAvailable) return;

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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card">

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
                                    This tool appears only in online mode when server processing is allowed
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

                        {isProcessing && (
                            <ProgressBar progress={progress} />
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {!error && isCheckingStatus && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                                <p className="text-blue-900 dark:text-blue-200 text-sm">
                                    Checking whether this deployment can run EPUB to MOBI conversion...
                                </p>
                            </div>
                        )}

                        {!error && !isCheckingStatus && !isRuntimeAvailable && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                                <p className="text-amber-900 dark:text-amber-200 text-sm">
                                    {hasVerificationFailure
                                        ? 'We could not verify the MOBI runtime on this deployment. Conversion stays disabled until the runtime status can be confirmed.'
                                        : 'This deployment is missing the configured MOBI runtime. Conversion is disabled until the server runtime is provisioned.'}
                                </p>
                            </div>
                        )}

                        {!error && !isCheckingStatus && isRuntimeAvailable && runtime && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                                <p className="text-green-900 dark:text-green-200 text-sm">
                                    Runtime verified: <strong>{runtime}</strong>
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
                                        disabled={isProcessing || isCheckingStatus || !isRuntimeAvailable}
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
