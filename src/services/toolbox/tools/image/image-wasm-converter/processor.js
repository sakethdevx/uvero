/**
 * Image WASM Converter Processor
 * Manages Web Worker for ImageMagick WASM-based conversion
 * Uses Canvas API for basic formats (JPG, PNG, WebP, BMP, GIF)
 * Uses WASM for advanced formats (AVIF, HEIC, JXL, RAW, PSD, TIFF, etc.)
 */

import magickWasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';

class ImageWasmConverterProcessor {
    constructor() {
        this.worker = null;
        this.wasmLoaded = false;
        this.magickWasmUrl = magickWasmUrl;
        // Basic formats that Canvas API can handle reliably
        this.basicFormats = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif']);
    }

    async ensureWasmLoaded() {
        if (this.wasmLoaded) return;

        try {
            const response = await fetch(this.magickWasmUrl);
            if (!response.ok) {
                throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
            }
            const wasmArrayBuffer = await response.arrayBuffer();

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

    getExtension(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? `.${ext}` : '';
    }

    async convert(file, outputFormat, quality = 92, keepMetadata = true, onProgress) {
        const outputExt = outputFormat.toLowerCase();
        const isBasicFormat = this.basicFormats.has(outputExt);

        // Route to appropriate conversion method
        if (isBasicFormat) {
            return this.canvasConvert(file, outputExt, quality, onProgress);
        } else {
            return this.wasmConvert(file, outputExt, quality, keepMetadata, onProgress);
        }
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
        const worker = this.initWorker();

        return new Promise((resolve, reject) => {
            const handleMessage = (e) => {
                const { type, output, error, isZip, id } = e.data;

                if (type === 'progress') {
                    if (onProgress) onProgress(e.data.progress || 0);
                } else if (type === 'finished') {
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);

                    const extension = outputExt === 'jpg' ? 'jpg' : outputExt;
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFileName = `${baseName}_converted.${extension}`;

                    const blob = new Blob([output], { type: `image/${extension}` });
                    const convertedFile = new File([blob], newFileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: outputExt.toUpperCase()
                    });
                } else if (type === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    reject(new Error(error || 'WASM conversion failed'));
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
                    to: outputExt,
                    quality,
                    keepMetadata,
                    id: file.name
                });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
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
