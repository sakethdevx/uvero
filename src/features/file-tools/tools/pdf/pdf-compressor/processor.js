/**
 * PDF Processor
 * Manages Web Worker for PDF compression
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Compress a PDF file
 * @param {File} file - The PDF file to compress
 * @param {string} level - Compression level: 'low', 'balanced', or 'high'
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Compressed PDF blob
 */
const compress = (file, level = 'balanced', onProgress = () => { }) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        // Simulate progress updates
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
                reject(new Error(error || 'Compression failed'));
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

        // Read file and send to worker
        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'compress',
                arrayBuffer: reader.result,
                level
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
    compress
};
