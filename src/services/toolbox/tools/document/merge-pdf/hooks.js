import { useState, useCallback, useRef, useEffect } from 'react';

export const usePdfMerge = () => {
    const cancel = useCallback(() => {
        if (isProcessing && workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
            // Re-attach listener logic here ideally... handled by effect instead.
        }
    }, [isProcessing]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const workerRef = useRef(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('./worker.js', import.meta.url), {
            type: 'module'
        });

        const worker = workerRef.current;

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

        return () => {
            worker.terminate();
        };
    }, []);

    const merge = useCallback((files, options = {}) => {
        if (!workerRef.current) return;

        setIsProcessing(true);
        setProgress(0);
        setProgressMessage('Starting merge...');
        setError(null);
        setResult(null);

        workerRef.current.postMessage({
            files,
            options,
            id: Date.now()
        });
    }, []);

    const reset = useCallback(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage('');
        setError(null);
        setResult(null);
    }, []);

    return {
        merge,
        reset,
        isProcessing,
        progress,
        progressMessage,
        error,
        result
    };
};