/**
 * Image Resizer Processor
 * Manages Web Worker for image resizing
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Resize image
 * @param {File} file - The image file to resize
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Resized image with url, filename, size, width, height
 */
const resize = (file, width, height, onProgress = () => { }) => {
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
                const originalName = file.name.replace(/\.[^/.]+$/, '');
                const extension = file.name.split('.').pop();
                const filename = `${originalName}_${data.width}x${data.height}.${extension}`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size,
                    width: data.width,
                    height: data.height
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Resize failed'));
            }
        };

        const handleError = (error) => {
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
                type: 'resize',
                arrayBuffer: reader.result,
                width,
                height,
                mimeType: file.type
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    resize
};
