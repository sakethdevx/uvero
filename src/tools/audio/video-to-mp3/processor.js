/**
 * Video to MP3 Conversion Processor
 * Handles Web Worker lifecycle and communication for audio extraction
 */

class VideoToMP3Processor {
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
     * Convert video to MP3 (offline mode - client-side)
     * @param {File} file - The video file
     * @param {number} bitrate - Target MP3 bitrate in kbps
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convert(file, bitrate, onProgress) {
        return new Promise((resolve, reject) => {
            const worker = this.initWorker();

            // Set up message handler
            worker.onmessage = (e) => {
                const { success, blob, size, duration, error } = e.data;

                if (success) {
                    // Create a new File object from the blob
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}.mp3`;

                    const convertedFile = new File([blob], newFileName, { type: 'audio/mpeg' });

                    resolve({
                        file: convertedFile,
                        blob,
                        size,
                        duration
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
                bitrate
            });

            // Simulate progress for better UX
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (onProgress) onProgress(Math.min(progress, 90));
                if (progress >= 90) clearInterval(progressInterval);
            }, 200);
        });
    }

    /**
     * Convert video to MP3 (online mode - server-side)
     * @param {File} file - The video file
     * @param {number} bitrate - Target MP3 bitrate in kbps
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convertOnline(file, bitrate, onProgress) {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('video', file);
            formData.append('bitrate', bitrate.toString());

            if (onProgress) onProgress(20);

            // Upload to our serverless API
            const response = await fetch('/api/convert-video-to-mp3', {
                method: 'POST',
                body: formData,
            });

            if (onProgress) onProgress(80);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Server conversion failed');
            }

            // Get metadata from headers
            const size = parseInt(response.headers.get('X-Audio-Size') || 0);
            const duration = response.headers.get('X-Duration') || 'N/A';

            // Get the MP3 audio as blob
            const blob = await response.blob();

            if (onProgress) onProgress(100);

            // Create a new File object
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}.mp3`;
            const convertedFile = new File([blob], newFileName, { type: 'audio/mpeg' });

            return {
                file: convertedFile,
                blob,
                size,
                duration
            };
        } catch (error) {
            console.error('Online conversion failed:', error);
            throw new Error('Server conversion unavailable. ' + error.message);
        }
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

export default new VideoToMP3Processor();
