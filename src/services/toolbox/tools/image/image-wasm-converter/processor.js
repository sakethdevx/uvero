/**
 * Image WASM Converter Processor
 * Uses Canvas for basic formats (JPG, PNG, WebP, BMP, GIF)
 * Uses WASM for advanced formats (AVIF, HEIC, TIFF, PSD, RAW, etc.)
 */

import magickWasmUrl from '@imagemagick/magick-wasm/dist/magick.wasm?url';
import workerUrl from './worker.js?worker&url';

class ImageWasmConverterProcessor {
    constructor() {
        this.wasm = null;
        this.wasmLoading = null;
        // Basic formats that Canvas can reliably convert
        this.basicFormats = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif']);
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
        const outputExt = outputFormat.toLowerCase();
        const isBasic = this.basicFormats.has(outputExt);

        // Use Canvas for basic formats (no WASM needed)
        if (isBasic) {
            return this.canvasConvert(file, outputExt, quality, onProgress);
        }

        // Use WASM for advanced formats
        return this.wasmConvert(file, outputExt, quality, keepMetadata, onProgress);
    }

    canvasConvert(file, outputExt, quality, onProgress) {
        return new Promise((resolve, reject) => {
            if (onProgress) onProgress(10);

            const img = new Image();
            img.onload = () => {
                if (onProgress) onProgress(30);
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                if (onProgress) onProgress(60);

                const mimeType = outputExt === 'jpg' ? 'image/jpeg' : `image/${outputExt}`;
                const qualityFactor = quality / 100;

                canvas.toBlob((blob) => {
                    if (onProgress) onProgress(90);
                    if (!blob) {
                        reject(new Error('Canvas conversion failed'));
                        return;
                    }
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}_converted.${outputExt}`;
                    const convertedFile = new File([blob], newFileName, { type: mimeType });
                    if (onProgress) onProgress(100);
                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: outputExt.toUpperCase()
                    });
                }, mimeType, qualityFactor);
            };

            img.onerror = () => reject(new Error('Failed to load image for conversion'));
            img.src = URL.createObjectURL(file);
            img.onloadend = () => URL.revokeObjectURL(img.src);
        });
    }

    async wasmConvert(file, outputExt, quality, keepMetadata, onProgress) {
        await this.ensureWasmLoaded();

        return new Promise((resolve, reject) => {
            const worker = new Worker(
                workerUrl,
                { type: 'module' }
            );

            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Conversion timeout after 30s'));
            }, 30000);

            const handleMessage = (e) => {
                const { type, output, error, progress, id } = e.data;

                if (type === 'ready') {
                    // Send WASM buffer to worker
                    worker.postMessage({
                        type: 'load',
                        wasm: this.wasm,
                        id: '1'
                    });
                } else if (type === 'loaded') {
                    // WASM ready, now send conversion request
                    const reader = new FileReader();
                    reader.onload = () => {
                        const to = outputExt.startsWith('.') ? outputExt : `.${outputExt}`;
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

                    const ext = outputExt === 'jpg' ? 'jpg' : outputExt;
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}_converted.${ext}`;

                    const blob = new Blob([output], { type: `image/${ext}` });
                    const convertedFile = new File([blob], newFileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: outputExt.toUpperCase()
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
        });
    }

    terminate() {
        // Workers are self-terminating
    }
}

const processor = new ImageWasmConverterProcessor();

export const cleanup = () => { };

export default {
    convert: (...args) => processor.convert(...args),
    terminate: () => { }
};
