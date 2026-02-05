/**
 * Image Conversion Processor
 * Handles Web Worker lifecycle and communication for image conversion
 */

class ImageConverterProcessor {
    constructor() {
        this.worker = null;
    }

    /**
     * Initialize the Web Worker
     */
    initWorker() {
        if (!this.worker) {
            this.worker = new Worker(
                new URL('./worker.js', import.meta.url),
                { type: 'module' }
            );
        }
        return this.worker;
    }

    /**
     * Convert an image file to a different format
     * @param {File} file - The image file to convert
     * @param {string} outputFormat - Target format (jpg, png, webp)
     * @param {number} width - Target width (optional)
     * @param {number} height - Target height (optional)
     * @param {boolean} maintainAspectRatio - Maintain aspect ratio when resizing
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convert(file, outputFormat, width, height, maintainAspectRatio, onProgress) {
        return new Promise((resolve, reject) => {
            const worker = this.initWorker();

            // Set up message handler
            worker.onmessage = (e) => {
                const { success, blob, originalSize, convertedSize, dimensions, error } = e.data;

                if (success) {
                    // Create a new File object from the blob
                    const extension = this.getExtension(outputFormat);
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}_converted${extension}`;

                    const convertedFile = new File([blob], newFileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize,
                        convertedSize,
                        dimensions,
                        format: outputFormat.toUpperCase()
                    });
                } else {
                    reject(new Error(error || 'Conversion failed'));
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            // Start processing
            if (onProgress) onProgress(0);
            worker.postMessage({
                file,
                outputFormat,
                width,
                height,
                maintainAspectRatio
            });

            // Simulate progress for better UX
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (onProgress) onProgress(progress);
                if (progress >= 90) clearInterval(progressInterval);
            }, 50);
        });
    }

    /**
     * Get file extension from format
     */
    getExtension(format) {
        const extensions = {
            'jpg': '.jpg',
            'jpeg': '.jpg',
            'png': '.png',
            'webp': '.webp'
        };
        return extensions[format.toLowerCase()] || '.png';
    }

    /**
     * Terminate the worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export default new ImageConverterProcessor();
