/**
 * PDF Protect Processor
 * Manages Web Worker for PDF protection
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Protect a PDF file
 * @param {File} file - The PDF file to protect
 * @param {string} password - The password to set
 * @param {Object} permissions - Permission options (reserved for future use)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Protected PDF blob
 */
const protect = (file, password, permissions = {}, onProgress = () => { }) => {
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
                reject(new Error(error || 'Protection failed'));
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
                type: 'protect',
                arrayBuffer: reader.result,
                password: password,
                permissions: permissions
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
    protect
};
