/**
 * Audio Converter Processor
 * Manages Web Worker for audio format conversion
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Convert audio to different format
 * @param {File} file - The audio file to convert
 * @param {string} format - Target format ('mp3', 'wav', 'ogg')
 * @param {number} bitrate - Target bitrate in kbps (for MP3/OGG)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Converted audio with url, filename, and size
 */
const convert = (file, format = 'mp3', bitrate = 192, onProgress = () => { }) => {
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
                const filename = `${originalName}.${format}`;

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
                format,
                bitrate
            });
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    convert
};
