/**
 * PDF Redaction Processor
 * Manages Web Worker for PDF redaction
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Get PDF page info
 * @param {File} file - The PDF file
 * @returns {Promise<{totalPages: number}>}
 */
const getPageInfo = (file) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        const handleMessage = (e) => {
            const { type, totalPages, error } = e.data;

            if (type === 'info') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                resolve({ totalPages });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Failed to read PDF info'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'getInfo',
                arrayBuffer: reader.result
            });
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Redact a PDF file
 * @param {File} file - The PDF file to redact
 * @param {Array} redactions - Array of {page, x, y, width, height, color}
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Redacted PDF blob
 */
const redact = (file, redactions, onProgress = () => { }) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        let progressInterval = null;
        let currentProgress = 0;

        const updateProgress = () => {
            if (currentProgress < 90) {
                currentProgress += Math.random() * 10;
                onProgress(Math.min(currentProgress, 90));
            }
        };

        progressInterval = setInterval(updateProgress, 300);

        const handleMessage = (e) => {
            const { type, data, error } = e.data;

            if (type === 'success') {
                clearInterval(progressInterval);
                onProgress(100);
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                resolve(data);
            } else if (type === 'error') {
                clearInterval(progressInterval);
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Redaction failed'));
            }
        };

        const handleError = (error) => {
            clearInterval(progressInterval);
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'redact',
                arrayBuffer: reader.result,
                redactions
            });
        };
        reader.onerror = () => {
            clearInterval(progressInterval);
            reject(new Error('Failed to read file'));
        };
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    getPageInfo,
    redact
};
