/**
 * Image WASM Converter Processor
 * Manages Web Worker for ImageMagick WASM-based conversion
 */

// WASM is served from public folder

class ImageWasmConverterProcessor {
    constructor() {
        this.worker = null;
        this.wasmLoaded = false;
    }

    async ensureWasmLoaded() {
        if (this.wasmLoaded) return;

        try {
            // Fetch WASM from public folder
            const response = await fetch('/magick.wasm');
            if (!response.ok) {
                throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
            }
            const wasmArrayBuffer = await response.arrayBuffer();

            // Send WASM to worker
            const worker = this.initWorker();
            await new Promise((resolve, reject) => {
                const onMessage = (e) => {
                    if (e.data.type === 'loaded') {
                        worker.removeEventListener('message', onMessage);
                        resolve();
                    } else if (e.data.type === 'error') {
                        worker.removeEventListener('message', onMessage);
                        reject(new Error(e.data.error || 'Worker failed to load WASM'));
                    }
                };
                worker.addEventListener('message', onMessage);
                worker.postMessage({
                    type: 'load',
                    wasm: wasmArrayBuffer,
                    id: '0'
                });
            });

            this.wasmLoaded = true;
        } catch (error) {
            this.terminate();
            throw error;
        }
    }

    initWorker() {
        if (!this.worker) {
            this.worker = new Worker(
                new URL('./worker.js', import.meta.url),
                { type: 'module' }
            );
        }
        return this.worker;
    }

    async convert(file, outputFormat, quality = 92, keepMetadata = true, onProgress) {
        return new Promise((resolve, reject) => {
            this.ensureWasmLoaded().then(() => {
                const worker = this.initWorker();

                const handleMessage = (e) => {
                    const { type, output, error, isZip, id } = e.data;

                    if (type === 'progress') {
                        if (onProgress) onProgress(e.data.progress || 0);
                    } else if (type === 'finished') {
                        worker.removeEventListener('message', handleMessage);
                        worker.removeEventListener('error', handleError);

                        const extension = outputFormat === 'jpg' ? 'jpg' : outputFormat;
                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        const newFileName = `${baseName}_converted.${extension}`;

                        const blob = new Blob([output], { type: `image/${extension}` });
                        const convertedFile = new File([blob], newFileName, { type: blob.type });

                        resolve({
                            file: convertedFile,
                            blob,
                            originalSize: file.size,
                            convertedSize: blob.size,
                            format: outputFormat.toUpperCase()
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
                    reject(error);
                };

                worker.addEventListener('message', handleMessage);
                worker.addEventListener('error', handleError);

                if (onProgress) onProgress(0);

                const reader = new FileReader();
                reader.onload = () => {
                    worker.postMessage({
                        type: 'convert',
                        arrayBuffer: reader.result,
                        to: outputFormat,
                        quality,
                        keepMetadata,
                        id: file.name
                    });
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            }).catch(reject);
        });
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.wasmLoaded = false;
    }
}

const processor = new ImageWasmConverterProcessor();

export const cleanup = () => processor.terminate();

export default {
    convert: (...args) => processor.convert(...args),
    terminate: () => processor.terminate()
};
