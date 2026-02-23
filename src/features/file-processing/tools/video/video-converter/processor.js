/**
 * Video Converter Processor
 * Manages Web Worker for video format conversion
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Convert video to different format
 * @param {File} file - The video file to convert
 * @param {string} outputFormat - Target format ('mp4', 'webm', 'avi', 'mov', 'mkv')
 * @param {string} quality - Quality level ('low', 'medium', 'high')
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Converted video with url, filename, and size
 */
const convert = (file, outputFormat = 'mp4', quality = 'high', onProgress = () => { }) => {
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
                const filename = `${originalName}_converted.${outputFormat}`;

                resolve({
                    url,
                    filename,
                    size: data.blob.size
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

        // Read file and send to worker
        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'convert',
                arrayBuffer: reader.result,
                outputFormat,
                quality,
                fileName: file.name
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    convert
};