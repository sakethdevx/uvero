/**
 * ImageMagick WASM Worker
 * Handles advanced image format conversion using ImageMagick
 */

import { initializeImageMagick, MagickFormat, MagickImage, MagickReadSettings } from '@imagemagick/magick-wasm';

let wasmBytes = null;
let initialized = false;

const formatExtensions = {
    [MagickFormat.Png]: 'png',
    [MagickFormat.Jpeg]: 'jpg',
    [MagickFormat.WebP]: 'webp',
    [MagickFormat.Gif]: 'gif',
    [MagickFormat.Tiff]: 'tiff',
    [MagickFormat.Bmp]: 'bmp',
    [MagickFormat.Ico]: 'ico',
    [MagickFormat.Heic]: 'heic',
    [MagickFormat.Heif]: 'heif',
    [MagickFormat.Jxl]: 'jxl',
    [MagickFormat.Avif]: 'avif',
    [MagickFormat.Svg]: 'svg',
    [MagickFormat.Eps]: 'eps',
    [MagickFormat.Psd]: 'psd',
    [MagickFormat.Arw]: 'arw',
    [MagickFormat.Cr2]: 'cr2',
    [MagickFormat.Dng]: 'dng',
    [MagickFormat.Raf]: 'raf',
    [MagickFormat.Orf]: 'orf',
    [MagickFormat.Pef]: 'pef',
    [MagickFormat.Rw2]: 'rw2',
    [MagickFormat.Nef]: 'nef',
    [MagickFormat.Srf]: 'srf',
    [MagickFormat.Crw]: 'crw',
    [MagickFormat.Cr3]: 'cr3',
    [MagickFormat.Dcr]: 'dcr',
    [MagickFormat.Mrw]: 'mrw',
    [MagickFormat.Mef]: 'mef',
    [MagickFormat.Erf]: 'erf',
    [MagickFormat.ThreeFr]: '3fr',
    [MagickFormat.X3F]: 'x3f',
    [MagickFormat.RsF]: 'rsf',
    [MagickFormat.IIQ]: 'iiq',
};

self.onmessage = async (e) => {
    const { type, arrayBuffer, to, quality, keepMetadata, id, wasm } = e.data;

    if (type === 'load' && wasm) {
        wasmBytes = new Uint8Array(wasm);
        await initializeImageMagick(wasmBytes);
        initialized = true;
        self.postMessage({ type: 'loaded', id });
        return;
    }

    if (type !== 'convert') {
        return;
    }

    try {
        if (!initialized) {
            throw new Error('ImageMagick not initialized. Load WASM first.');
        }

        const inputBuffer = new Uint8Array(arrayBuffer);
        const inputName = `input.${to === 'svg' ? 'svg' : 'bin'}`;

        const settings = new MagickReadSettings();
        settings.format = to === 'svg' ? MagickFormat.Svg : MagickFormat.Unknown;

        const image = MagickImage.create(inputBuffer, settings);

        if (to === 'svg') {
            const svg = image.getCanvas();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const result = await blob.arrayBuffer();
            image.dispose();

            self.postMessage({
                type: 'finished',
                output: result,
                isZip: false,
                id
            });
            return;
        }

        const targetFormat = Object.keys(formatExtensions).find(f => formatExtensions[f] === to);
        if (!targetFormat) {
            throw new Error(`Unsupported output format: ${to}`);
        }

        image.format(targetFormat);

        if (quality !== undefined && quality !== null) {
            const normalizedQuality = Math.min(100, Math.max(1, quality));
            switch (targetFormat) {
                case MagickFormat.Jpeg:
                case MagickFormat.Jpg:
                    image.compressionQuality(normalizedQuality);
                    break;
                case MagickFormat.WebP:
                    image.compressionQuality(normalizedQuality);
                    break;
            }
        }

        if (!keepMetadata) {
            image.strip();
        }

        const outputBlob = image.writeToBlob();
        image.dispose();

        const result = await outputBlob.arrayBuffer();

        self.postMessage({
            type: 'finished',
            output: result,
            isZip: false,
            id
        });

    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message,
            id
        });
    }
};

self.onmessage = async (e) => {
    const { type, arrayBuffer, to, quality, keepMetadata, id } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        if (!initialized) {
            self.postMessage({ type: 'progress', progress: 5 });
            const wasmUrl = await fetch('/magick.wasm').then(r => r.arrayBuffer());
            await initializeImageMagick(new Uint8Array(wasmUrl));
            initialized = true;
            self.postMessage({ type: 'progress', progress: 20 });
        }

        const inputBuffer = new Uint8Array(arrayBuffer);
        const inputName = `input.${to === 'svg' ? 'svg' : 'bin'}`;

        const settings = new MagickReadSettings();
        settings.format = to === 'svg' ? MagickFormat.Svg : MagickFormat.Unknown;

        const image = MagickImage.create(inputBuffer, settings);

        if (to === 'svg') {
            const svg = image.getCanvas();
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const result = await blob.arrayBuffer();
            image.dispose();

            self.postMessage({
                type: 'finished',
                output: result,
                isZip: false,
                id
            });
            return;
        }

        const targetFormat = Object.keys(formatExtensions).find(f => formatExtensions[f] === to);
        if (!targetFormat) {
            throw new Error(`Unsupported output format: ${to}`);
        }

        image.format(targetFormat);

        if (quality !== undefined && quality !== null) {
            const normalizedQuality = Math.min(100, Math.max(1, quality));
            switch (targetFormat) {
                case MagickFormat.Jpeg:
                case MagickFormat.Jpg:
                    image.compressionQuality(normalizedQuality);
                    break;
                case MagickFormat.WebP:
                    image.compressionQuality(normalizedQuality);
                    break;
            }
        }

        if (!keepMetadata) {
            image.strip();
        }

        const outputBlob = image.writeToBlob();
        image.dispose();

        const result = await outputBlob.arrayBuffer();

        self.postMessage({
            type: 'finished',
            output: result,
            isZip: false,
            id
        });

    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message,
            id
        });
    }
};
