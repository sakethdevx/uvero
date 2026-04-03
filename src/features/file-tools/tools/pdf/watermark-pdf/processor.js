/**
 * PDF Watermark Processor
 * Manages Web Worker for PDF watermarking
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Add a watermark to a PDF file
 * @param {File} file - The PDF file to watermark
 * @param {Object} options - Watermark options
 * @param {string} options.type - 'text' or 'image'
 * @param {string} options.text - Watermark text (for text type)
 * @param {number} options.fontSize - Font size (for text type)
 * @param {string} options.color - Hex color (for text type)
 * @param {number} options.opacity - Opacity 0-1
 * @param {number} options.rotation - Rotation angle in degrees (for text type)
 * @param {string} options.position - Position: center, top-left, top-right, bottom-left, bottom-right, diagonal
 * @param {ArrayBuffer} options.imageData - Image data (for image type)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Watermarked PDF blob
 */
const addWatermark = (file, options = {}, onProgress = () => { }) => {
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
                reject(new Error(error || 'Watermarking failed'));
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
            const messageData = {
                type: 'watermark',
                arrayBuffer: reader.result,
                options
            };
            worker.postMessage(messageData);
        };
        reader.onerror = () => {
            clearInterval(progressInterval);
            reject(new Error('Failed to read file'));
        };
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    addWatermark
};
