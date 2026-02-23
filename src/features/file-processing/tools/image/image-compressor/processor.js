/**
 * Image Compression Processor
 * Handles Web Worker lifecycle and communication
 */

class ImageCompressorProcessor {
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
     * Compress an image file
     * @param {File} file - The image file to compress
     * @param {number} quality - Compression quality (0-100)
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Compressed file result
     */
    async compress(file, quality, onProgress) {
        return new Promise((resolve, reject) => {
            const worker = this.initWorker();

            // Set up message handler
            worker.onmessage = (e) => {
                const { success, blob, originalSize, compressedSize, error } = e.data;

                if (success) {
                    // Create a new File object from the blob
                    const compressedFile = new File(
                        [blob],
                        file.name.replace(/\.[^/.]+$/, '') + '_compressed' + this.getExtension(blob.type),
                        { type: blob.type }
                    );

                    resolve({
                        file: compressedFile,
                        blob,
                        originalSize,
                        compressedSize,
                        reduction: Math.round(((originalSize - compressedSize) / originalSize) * 100)
                    });
                } else {
                    reject(new Error(error || 'Compression failed'));
                }
            };

            worker.onerror = (error) => {
                reject(error);
            };

            // Start processing
            if (onProgress) onProgress(0);
            worker.postMessage({ file, quality });

            // Simulate progress for better UX (actual compression is fast)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (onProgress) onProgress(progress);
                if (progress >= 90) clearInterval(progressInterval);
            }, 50);
        });
    }

    /**
     * Get file extension from MIME type
     */
    getExtension(mimeType) {
        const extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp'
        };
        return extensions[mimeType] || '.jpg';
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

export default new ImageCompressorProcessor();
