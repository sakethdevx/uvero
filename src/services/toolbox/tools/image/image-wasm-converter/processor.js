/**
 * Image WASM Converter Processor
 * Follows VERT pattern: load WASM once, transfer to per-conversion workers
 */

import magickWasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';

class ImageWasmConverterProcessor {
    constructor() {
        this.wasm = null;
        this.wasmLoading = null;
    }

    async ensureWasmLoaded() {
        if (this.wasm) return;

        if (!this.wasmLoading) {
            this.wasmLoading = (async () => {
                const response = await fetch(magickWasmUrl);
                if (!response.ok) {
                    throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
                }
                this.wasm = await response.arrayBuffer();
            })();
        }

        await this.wasmLoading;
    }

    getExtension(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? `.${ext}` : '';
    }

    async convert(file, outputFormat, quality = 92, keepMetadata = true, onProgress) {
        await this.ensureWasmLoaded();

        return new Promise((resolve, reject) => {
            const worker = new Worker(
                new URL('./worker.js', import.meta.url),
                { type: 'module' }
            );

            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Conversion timeout after 30s'));
            }, 30000);

            const handleMessage = (e) => {
                const { type, output, error, progress, id } = e.data;

                if (type === 'ready') {
                    // Worker is ready to receive load
                } else if (type === 'loaded') {
                    // WASM loaded, now send convert
                    const reader = new FileReader();
                    reader.onload = () => {
                        const to = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
                        worker.postMessage({
                            type: 'convert',
                            input: {
                                file,
                                name: file.name,
                                from: this.getExtension(file.name),
                                to
                            },
                            to,
                            quality,
                            keepMetadata,
                            id: '1'
                        });
                    };
                    reader.onerror = () => {
                        worker.terminate();
                        reject(new Error('Failed to read file'));
                    };
                    reader.readAsArrayBuffer(file);
                } else if (type === 'progress') {
                    if (onProgress) onProgress(progress || 0);
                } else if (type === 'finished') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    worker.terminate();

                    const ext = outputFormat === 'jpg' ? 'jpg' : outputFormat.toLowerCase();
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}_converted.${ext}`;

                    const blob = new Blob([output], { type: `image/${ext}` });
                    const convertedFile = new File([blob], newFileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: outputFormat.toUpperCase()
                    });
                } else if (type === 'error') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    worker.terminate();
                    reject(new Error(error || 'WASM conversion failed'));
                }
            };

            const handleError = (error) => {
                clearTimeout(timeout);
                worker.terminate();
                reject(error);
            };

            worker.addEventListener('message', handleMessage);
            worker.addEventListener('error', handleError);

            // Send load message with WASM buffer first
            worker.postMessage({
                type: 'load',
                wasm: this.wasm,
                id: '1'
            });
        });
    }

    terminate() {
        // Workers are terminated after each conversion
    }
}

const processor = new ImageWasmConverterProcessor();

export const cleanup = () => {};

export default {
    convert: (...args) => processor.convert(...args),
    terminate: () => {}
};
