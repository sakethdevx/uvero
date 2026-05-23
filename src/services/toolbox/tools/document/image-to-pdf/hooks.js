import { useState, useCallback, useRef, useEffect } from 'react';
import ImageToPdfWorker from './worker?worker';

export const convertImageToSupportedFormat = (file) => {
    return new Promise((resolve, reject) => {
        // If it's already a JPEG or PNG, just use it
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
            resolve(file);
            return;
        }

        // Use canvas to convert other formats (like webp, svg) to JPEG
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Fill with white background for transparency (like PNG to JPEG, or SVG)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(objectUrl); // Clean up
                if (!blob) {
                    reject(new Error('Canvas to Blob conversion failed'));
                    return;
                }
                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                    type: 'image/jpeg',
                });
                resolve(newFile);
            }, 'image/jpeg', 0.9); // Quality 0.9
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`Failed to load image: ${file.name}`));
        };

        img.src = objectUrl;
    });
};

export const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer'));
        reader.readAsArrayBuffer(file);
    });
};

export const useImageToPdf = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [resultPdf, setResultPdf] = useState(null);
    const workerRef = useRef(null);
    const nextId = useRef(0);

    const initWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new ImageToPdfWorker();
        }
    }, []);

    const cleanupWorker = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
    }, []);

    useEffect(() => {
        initWorker();
        return cleanupWorker;
    }, [initWorker, cleanupWorker]);

    // Cleanup object URL when result changes or unmounts
    useEffect(() => {
        return () => {
            if (resultPdf && typeof resultPdf !== 'string') {
                URL.revokeObjectURL(resultPdf.url);
            }
        };
    }, [resultPdf]);

    const generatePdf = useCallback(async (files, options = {}) => {
        setIsProcessing(true);
        setError(null);
        setProgress(0);
        setResultPdf(null);

        try {
            if (!workerRef.current) {
                initWorker();
            }

            // Phase 1: Pre-process files (Convert to ArrayBuffers, handle WEBP/SVG fallback)
            const processedImages = [];
            const totalFiles = files.length;

            for (let i = 0; i < totalFiles; i++) {
                setProgress(Math.round((i / totalFiles) * 30)); // 0-30% for preprocessing
                const file = files[i];
                const supportedFile = await convertImageToSupportedFormat(file);
                const arrayBuffer = await readFileAsArrayBuffer(supportedFile);

                processedImages.push({
                    bytes: new Uint8Array(arrayBuffer),
                    type: supportedFile.type,
                    name: supportedFile.name
                });
            }

            setProgress(40); // Preprocessing done

            // Phase 2: Web Worker execution
            return new Promise((resolve, reject) => {
                const messageId = nextId.current++;

                const handleMessage = (e) => {
                    const { id, status, result, error: workerError } = e.data;

                    if (id === messageId) {
                        workerRef.current.removeEventListener('message', handleMessage);
                        workerRef.current.removeEventListener('error', handleError);

                        if (status === 'success') {
                            setProgress(100);

                            // Create blob and ObjectURL
                            const blob = new Blob([result], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const resultObj = {
                                url,
                                name: `Combined_Images.pdf`,
                                size: blob.size,
                                blob
                            };
                            setResultPdf(resultObj);
                            setIsProcessing(false);
                            resolve(resultObj);
                        } else {
                            setIsProcessing(false);
                            const errMsg = workerError || 'PDF generation failed in worker';
                            setError(errMsg);
                            reject(new Error(errMsg));
                        }
                    }
                };

                const handleError = (e) => {
                    workerRef.current.removeEventListener('message', handleMessage);
                    workerRef.current.removeEventListener('error', handleError);
                    setIsProcessing(false);
                    setError(e.message || 'Worker thread error');
                    reject(new Error(e.message || 'Worker thread error'));
                };

                workerRef.current.addEventListener('message', handleMessage);
                workerRef.current.addEventListener('error', handleError);

                // Send to worker
                workerRef.current.postMessage({
                    id: messageId,
                    images: processedImages,
                    options
                });

                setProgress(50); // Sent to worker
            });

        } catch (err) {
            console.error('Build PDF Error:', err);
            setError(err.message || 'An unexpected error occurred building the PDF');
            setIsProcessing(false);
            throw err;

        }
    }, [initWorker]);

    return {
        isProcessing,
        progress,
        error,
        resultPdf,
        generatePdf,
        clearResult: useCallback(() => setResultPdf(null), [])
    };
};
