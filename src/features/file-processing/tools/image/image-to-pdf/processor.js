/**
 * Image to PDF Processor
 * Manages Web Worker for PDF creation
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Convert images to PDF
 * @param {Array<File>} files - Array of image files
 * @param {string} pageSize - Page size option ('fit', 'a4', 'letter')
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - PDF blob
 */
const convert = (files, pageSize = 'fit', onProgress = () => { }) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        let progressInterval = null;
        let currentProgress = 0;

        const updateProgress = () => {
            if (currentProgress < 90) {
                currentProgress += Math.random() * 8;
                onProgress(Math.min(currentProgress, 90));
            }
        };

        progressInterval = setInterval(updateProgress, 400);

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
                reject(new Error(error || 'Conversion failed'));
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

        // Read all files
        const readPromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    data: reader.result,
                    name: file.name,
                    type: file.type
                });
                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(readPromises)
            .then(imageData => {
                worker.postMessage({
                    type: 'convert',
                    images: imageData,
                    pageSize
                });
            })
            .catch(error => {
                clearInterval(progressInterval);
                reject(error);
            });
    });
};

export const processor = {
    convert
};
