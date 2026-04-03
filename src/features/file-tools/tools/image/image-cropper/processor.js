/**
 * Image Cropper Processor
 * Manages Web Worker for image cropping
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Crop image
 * @param {File} file - The image file
 * @param {Object} cropArea - Crop coordinates
 * @param {number} cropArea.x - X coordinate
 * @param {number} cropArea.y - Y coordinate
 * @param {number} cropArea.width - Crop width
 * @param {number} cropArea.height - Crop height
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Cropped image with url, filename, and size
 */
const cropImage = (file, cropArea, onProgress = () => { }) => {
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
                const filename = `${originalName}_cropped.png`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Failed to crop image'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Read image
        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'crop',
                imageBuffer: reader.result,
                cropArea
            });
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    cropImage
};