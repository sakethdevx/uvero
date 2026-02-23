/**
 * Video Compressor Processor
 * Manages Web Worker for video compression
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Compress video
 * @param {File} file - The video file to compress
 * @param {string} quality - Quality level ('low', 'medium', 'high')
 * @param {string} resolution - Target resolution ('original', '480p', '720p', '1080p')
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Compressed video with url, filename, and size
 */
const compress = (file, quality = 'medium', resolution = 'original', onProgress = () => { }) => {
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
                const filename = `${originalName}_compressed.mp4`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size
                });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Compression failed'));
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
                type: 'compress',
                arrayBuffer: reader.result,
                quality,
                resolution,
                fileName: file.name
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    compress
};
