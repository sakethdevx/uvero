/**
 * GIF Maker Processor
 * Manages Web Worker for GIF creation
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Create animated GIF from images or video
 * @param {File[]} files - Image files or single video file
 * @param {string} inputType - 'images' or 'video'
 * @param {Object} options - GIF creation options
 * @param {number} options.frameDelay - Delay between frames in ms (for images)
 * @param {number} options.quality - Quality setting (1-30, lower = better)
 * @param {number} options.width - Output width in pixels
 * @param {number} options.loop - Loop count (0 = infinite)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - GIF with url, filename, and size
 */
const createGIF = (files, inputType, options, onProgress = () => { }) => {
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
                const timestamp = new Date().toISOString().slice(0, 10);
                const filename = inputType === 'images'
                    ? `animated_${timestamp}.gif`
                    : `video_${timestamp}.gif`;

                resolve({
                    blob: data.blob,
                    url,
                    filename,
                    size: data.blob.size
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'GIF creation failed'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        if (inputType === 'images') {
            // Process images
            Promise.all(files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('Failed to read file: ' + file.name));
                    reader.readAsArrayBuffer(file);
                });
            }))
                .then(arrayBuffers => {
                    worker.postMessage({
                        type: 'createFromImages',
                        imageBuffers: arrayBuffers,
                        options
                    });
                })
                .catch(reject);
        } else {
            // Process video
            const reader = new FileReader();
            reader.onload = () => {
                worker.postMessage({
                    type: 'createFromVideo',
                    videoBuffer: reader.result,
                    fileName: files[0].name,
                    options
                });
            };
            reader.onerror = () => reject(new Error('Failed to read video file'));
            reader.readAsArrayBuffer(files[0]);
        }
    });
};

export const processor = {
    createGIF
};
