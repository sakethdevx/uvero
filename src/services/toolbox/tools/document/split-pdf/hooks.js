import { useState, useCallback, useRef, useEffect } from 'react';

export const usePdfSplit = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const workerRef = useRef(null);

    const initWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker(new URL('./worker.js', import.meta.url), {
            type: 'module'
        });

        worker.onmessage = (e) => {
            const { type, percentage, message, blob, filename, metadata, error: workerError } = e.data;

            switch (type) {
                case 'progress':
                    setProgress(percentage);
                    setProgressMessage(message);
                    break;
                case 'success':
                    setResult({ blob, filename, metadata });
                    setIsProcessing(false);
                    setProgress(100);
                    break;
                case 'error':
                    setError(new Error(workerError));
                    setIsProcessing(false);
                    break;
                default:
                    console.warn(`Unknown message type from worker: ${type}`);
            }
        };
        workerRef.current = worker;
    }, []);

    useEffect(() => {
        initWorker();

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [initWorker]);

    const split = useCallback((files, options = {}) => {
        if (!workerRef.current) {
            initWorker();
        }

        setIsProcessing(true);
        setProgress(0);
        setProgressMessage('Starting split...');
        setError(null);
        setResult(null);

        workerRef.current.postMessage({
            files,
            options,
            id: Date.now()
        });
    }, [initWorker]);

    const cancel = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
        setError(new Error('Processing was cancelled.'));
    }, []);

    const reset = useCallback(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
        setError(null);
        setResult(null);
    }, []);

    return {
        split,
        cancel,
        reset,
        isProcessing,
        progress,
        progressMessage,
        error,
        result
    };
};