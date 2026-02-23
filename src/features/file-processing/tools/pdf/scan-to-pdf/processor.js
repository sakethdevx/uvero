/**
 * Scan to PDF Processor
 * Manages Web Worker for converting images to PDF
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Convert multiple images to a single PDF
 * @param {File[]} images - Array of image files
 * @param {Object} options - Conversion options { pageSize, orientation, margin, quality }
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - PDF with blob, url, filename, totalPages
 */
const convert = (images, options = {}, onProgress = () => { }) => {
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
                const filename = `scanned_${Date.now()}.pdf`;

                resolve({
                    blob: data.blob,
                    url,
                    filename,
                    totalPages: data.totalPages
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Conversion failed'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Read all image files and send to worker
        const readPromises = images.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ data: reader.result, name: file.name, type: file.type });
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(readPromises)
            .then(imageDataArray => {
                worker.postMessage({
                    type: 'convert',
                    images: imageDataArray,
                    options
                });
            })
            .catch(reject);
    });
};

export const processor = {
    convert
};
