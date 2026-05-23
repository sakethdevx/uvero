import { useCallback, useEffect, useRef, useState } from 'react';

export const usePdfToImage = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const workerRef = useRef(null);
    const resultUrlRef = useRef(null);

    const revokeResultUrl = useCallback(() => {
        if (resultUrlRef.current) {
            URL.revokeObjectURL(resultUrlRef.current);
            resultUrlRef.current = null;
        }
    }, []);

    const initWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker(new URL('./worker.js', import.meta.url), {
            type: 'module',
        });

        worker.onmessage = (event) => {
            const {
                type,
                percentage,
                message,
                blob,
                filename,
                outputType,
                metadata,
                error: workerError,
            } = event.data;

            switch (type) {
                case 'progress':
                    setProgress(percentage);
                    setProgressMessage(message);
                    break;
                case 'success': {
                    const url = URL.createObjectURL(blob);
                    revokeResultUrl();
                    resultUrlRef.current = url;
                    setResult({
                        blob,
                        url,
                        filename,
                        outputType,
                        metadata,
                    });
                    setProgress(100);
                    setProgressMessage('Export complete.');
                    setIsProcessing(false);
                    break;
                }
                case 'error':
                    setError(new Error(workerError));
                    setIsProcessing(false);
                    break;
                default:
                    console.warn(`Unknown message type from PDF to Image worker: ${type}`);
            }
        };

        worker.onerror = (event) => {
            setError(new Error(event.message || 'Worker thread error'));
            setIsProcessing(false);
        };

        workerRef.current = worker;
    }, [revokeResultUrl]);

    useEffect(() => {
        initWorker();

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            revokeResultUrl();
        };
    }, [initWorker, revokeResultUrl]);

    const exportImages = useCallback((files, options = {}) => {
        if (!workerRef.current) {
            initWorker();
        }

        revokeResultUrl();
        setResult(null);
        setIsProcessing(true);
        setProgress(0);
        setProgressMessage('Starting export...');
        setError(null);

        workerRef.current.postMessage({
            files,
            options,
            id: Date.now(),
        });
    }, [initWorker, revokeResultUrl]);

    const cancel = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
        setError(new Error('Export was cancelled.'));
    }, []);

    const reset = useCallback(() => {
        revokeResultUrl();
        setResult(null);
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
        setError(null);
    }, [revokeResultUrl]);

    return {
        exportImages,
        cancel,
        reset,
        isProcessing,
        progress,
        progressMessage,
        error,
        result,
    };
};
