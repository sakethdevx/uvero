/**
 * PDF to PowerPoint Processor
 * Manages the PDF to PowerPoint conversion workflow
 */

class PDFToPowerPointProcessor {
    constructor() {
        this.worker = null;
    }

    /**
     * Initialize web worker
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
     * Convert PDF to PowerPoint document
     */
    async convert(file, onProgress) {
        return new Promise((resolve, reject) => {
            const worker = this.initWorker();

            // Read file as ArrayBuffer
            const reader = new FileReader();

            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;

                // Set up worker message handler
                worker.onmessage = (event) => {
                    const { type, data, error, progress } = event.data;

                    if (type === 'progress' && onProgress) {
                        onProgress(progress);
                    } else if (type === 'success') {
                        resolve(data);
                    } else if (type === 'error') {
                        reject(new Error(error));
                    }
                };

                worker.onerror = (error) => {
                    reject(new Error('Worker error: ' + error.message));
                };

                // Send conversion request to worker
                worker.postMessage({
                    type: 'convert',
                    arrayBuffer: arrayBuffer
                });
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Clean up worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// Export singleton instance
export const processor = new PDFToPowerPointProcessor();
