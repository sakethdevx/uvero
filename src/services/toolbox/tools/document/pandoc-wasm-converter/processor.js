/**
 * Pandoc WASM Processor
 * Manages Web Worker for Pandoc-based document conversion
 */

import pandocWasm from '@imagemagick/magick-wasm?url'; // Actually we'll use separate URL

class PandocWasmProcessor {
    worker = null;
    wasmLoaded = false;

    async ensureWasmLoaded() {
        if (this.wasmLoaded) return;

        try {
            // Fetch pandoc.wasm from public folder
            const response = await fetch('/pandoc.wasm');
            if (!response.ok) {
                throw new Error(`Failed to load pandoc.wasm: ${response.status}`);
            }
            const wasmArrayBuffer = await response.arrayBuffer();

            // Initialize worker
            this.worker = new Worker(
                new URL('./worker.js', import.meta.url),
                { type: 'module' }
            );

            // Wait for worker to load WASM
            await new Promise((resolve, reject) => {
                const onMessage = (e) => {
                    const { type, error, id } = e.data;
                    if (type === 'loaded') {
                        this.worker?.removeEventListener('message', onMessage);
                        resolve(undefined);
                    } else if (type === 'error') {
                        this.worker?.removeEventListener('message', onMessage);
                        reject(new Error(error || 'Worker failed to load WASM'));
                    }
                };
                const onError = (err) => reject(err);
                this.worker?.addEventListener('message', onMessage);
                this.worker?.addEventListener('error', onError);
                this.worker?.postMessage({
                    type: 'load',
                    wasm: wasmArrayBuffer,
                    id: 'load'
                });
            });

            this.wasmLoaded = true;
        } catch (err) {
            this.terminate();
            throw err;
        }
    }

    async convert(file, to, onProgress) {
        await this.ensureWasmLoaded();

        return new Promise((resolve, reject) => {
            const worker = this.worker;

            const handleMessage = (e) => {
                const { type, output, error, isZip, id } = e.data;
                if (type === 'progress') {
                    if (onProgress) onProgress(e.data.progress || 0);
                } else if (type === 'finished') {
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);

                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const extension = to.startsWith('.') ? to.slice(1) : to;
                    const fileName = `${baseName}.${extension}`;

                    const blob = new Blob([output], { type: 'application/octet-stream' });
                    const convertedFile = new File([blob], fileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: to
                    });
                } else if (type === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    reject(new Error(error || 'Conversion failed'));
                }
            };

            const handleError = (err) => {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(err);
            };

            worker.addEventListener('message', handleMessage);
            worker.addEventListener('error', handleError);

            if (onProgress) onProgress(0);

            worker.postMessage({
                type: 'convert',
                input: {
                    file,
                    name: file.name,
                    from: this.getExtension(file.name),
                    to: to.startsWith('.') ? to : `.${to}`
                },
                id: file.name
            });
        });
    }

     getExtension(filename) {
         const ext = filename.split('.').pop()?.toLowerCase();
         // Default to txt for unknown extensions
         return ext ? `.${ext}` : '.txt';
     }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.wasmLoaded = false;
    }
}

const processor = new PandocWasmProcessor();

export const cleanup = () => processor.terminate();

export default {
    convert: (...args) => processor.convert(...args),
    terminate: () => processor.terminate()
};
