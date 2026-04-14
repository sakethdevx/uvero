/**
 * PDF Edit Processor
 * Manages Web Worker for PDF editing
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
        const w = initWorker();

        const handleMessage = (e) => {
            const { type, totalPages, error } = e.data;
            if (type === 'info') {
                w.removeEventListener('message', handleMessage);
                w.removeEventListener('error', handleError);
                resolve({ totalPages });
            } else if (type === 'error') {
                w.removeEventListener('message', handleMessage);
                w.removeEventListener('error', handleError);
                reject(new Error(error || 'Failed to read PDF'));
            }
        };

        const handleError = (error) => {
            w.removeEventListener('message', handleMessage);
            w.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        w.addEventListener('message', handleMessage);
        w.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            w.postMessage({ type: 'getInfo', arrayBuffer: reader.result });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Edit a PDF file with annotations
 * @param {File} file - The PDF file to edit
 * @param {Array} annotations - Array of annotation objects
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Edited PDF blob
 */
const edit = (file, annotations, onProgress = () => {}) => {
    return new Promise((resolve, reject) => {
        const w = initWorker();

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
                w.removeEventListener('message', handleMessage);
                w.removeEventListener('error', handleError);
                resolve(data);
            } else if (type === 'error') {
                clearInterval(progressInterval);
                w.removeEventListener('message', handleMessage);
                w.removeEventListener('error', handleError);
                reject(new Error(error || 'Edit failed'));
            }
        };

        const handleError = (error) => {
            clearInterval(progressInterval);
            w.removeEventListener('message', handleMessage);
            w.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        w.addEventListener('message', handleMessage);
        w.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            w.postMessage({
                type: 'edit',
                arrayBuffer: reader.result,
                annotations
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
    edit
};
