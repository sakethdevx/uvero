/**
 * Image WASM Converter Processor
 * Manages Web Worker for ImageMagick WASM-based conversion
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
            // Fetch WASM from bundled assets (Vite handles ?url import)
            const response = await fetch(this.magickWasmUrl);
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
        // Check if we can use Canvas fallback for basic formats (extensions without dot)
        const inputExt = this.getExtension(file.name).replace(/^\./, '');
        const outputExt = outputFormat.toLowerCase();
        const canUseCanvas = this.basicFormats.has(inputExt) && this.basicFormats.has(outputExt);

        // If basic formats and WASM might fail, try WASM first then fallback to Canvas
        return new Promise((resolve, reject) => {
            const attemptWasm = () => {
                this.ensureWasmLoaded().then(() => {
                    const worker = this.initWorker();

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
                            const errMsg = error || 'WASM conversion failed';
                            // If WASM fails due to decode/unsupported and Canvas fallback available, try it
                            if ((errMsg.includes('NoDecodeDelegateForThisImageFormat') || errMsg.includes('Unsupported')) && canUseCanvas) {
                                console.log('WASM failed, falling back to Canvas for basic format conversion');
                                attemptCanvas();
                            } else {
                                reject(new Error(errMsg));
                            }
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
                }).catch(reject);
            };

            const attemptCanvas = () => {
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
                    const mimeType = `image/${outputExt === 'jpg' ? 'jpeg' : outputExt}`;
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
                img.onerror = () => reject(new Error('Failed to load image for Canvas fallback'));
                // Revoke after load to free memory
                img.src = URL.createObjectURL(file);
                img.onloadend = () => URL.revokeObjectURL(img.src);
            };

            if (canUseCanvas) {
                // For basic formats, we can directly use Canvas as it's reliable and fast
                // But try WASM first to keep consistency; if WASM fails, fallback
                attemptWasm();
            } else {
                // For advanced formats (AVIF, HEIC, RAW, TIFF, etc.), must use WASM
                attemptWasm();
            }
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
