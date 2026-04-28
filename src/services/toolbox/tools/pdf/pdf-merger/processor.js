/**
 * PDF Merger Processor
 * Manages Web Worker for PDF merging
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Merge multiple PDF files into one
 * @param {File[]} files - Array of PDF files to merge
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Merged PDF with url, filename, size, and totalPages
 */
const merge = (files, onProgress = () => { }) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        const handleMessage = (e) => {
            const { type, data, progress, error } = e.data;

            if (type === 'progress') {
                onProgress(progress);
            } else if (type === 'success') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);

                const url = URL.createObjectURL(data.blob);
                const filename = `merged_${Date.now()}.pdf`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size,
                    totalPages: data.totalPages
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Merge failed'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Read all files and send to worker
        const readPromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(readPromises)
            .then(arrayBuffers => {
                worker.postMessage({
                    type: 'merge',
                    pdfs: arrayBuffers
                });
            })
            .catch(reject);
    });
};

export const processor = {
    merge
};
