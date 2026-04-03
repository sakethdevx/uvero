/**
 * Page Numbers Processor
 * Manages Web Worker for adding page numbers to PDFs
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Add page numbers to a PDF file
 * @param {File} file - The PDF file
 * @param {Object} options - { position, startNumber, fontSize, format, color, margin }
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - PDF blob with page numbers
 */
const addPageNumbers = (file, options, onProgress = () => { }) => {
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
                reject(new Error(error || 'Failed to add page numbers'));
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
                type: 'addPageNumbers',
                arrayBuffer: reader.result,
                options
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
    addPageNumbers
};
