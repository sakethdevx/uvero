/**
 * Watermark Processor
 * Manages Web Worker for adding watermarks to images
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Add watermark to image
 * @param {File} file - The image file
 * @param {Object} options - Watermark options
 * @param {string} options.type - 'text' or 'image'
 * @param {string} options.text - Watermark text (for text type)
 * @param {number} options.fontSize - Font size in pixels
 * @param {number} options.opacity - Opacity (0-1)
 * @param {string} options.position - Position ('top-left', 'center', etc.)
 * @param {string} options.color - Text color (hex)
 * @param {File} options.watermarkImage - Watermark image file (for image type)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Watermarked image with url, filename, and size
 */
const addWatermark = (file, options, onProgress = () => { }) => {
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
                const filename = `${originalName}_watermarked.png`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Failed to add watermark'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Read main image
        const reader = new FileReader();
        reader.onload = async () => {
            const imageBuffer = reader.result;

            // If using image watermark, read it too
            if (options.type === 'image' && options.watermarkImage) {
                const watermarkReader = new FileReader();
                watermarkReader.onload = () => {
                    worker.postMessage({
                        type: 'addWatermark',
                        imageBuffer,
                        watermarkBuffer: watermarkReader.result,
                        options: {
                            ...options,
                            watermarkImage: undefined // Remove File object
                        }
                    });
                };
                watermarkReader.onerror = () => reject(new Error('Failed to read watermark image'));
                watermarkReader.readAsArrayBuffer(options.watermarkImage);
            } else {
                // Text watermark
                worker.postMessage({
                    type: 'addWatermark',
                    imageBuffer,
                    options
                });
            }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    addWatermark
};