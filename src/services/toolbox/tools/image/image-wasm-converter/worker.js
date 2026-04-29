import {
    initializeImageMagick,
    MagickFormat,
    MagickImage,
    MagickReadSettings,
} from '@imagemagick/magick-wasm';
import { makeZip } from 'client-zip';

let magickInitialized = false;

self.postMessage({ type: 'ready', id: '0' });

const handleMessage = async (message) => {
    switch (message.type) {
        case 'load': {
            try {
                if (!message.wasm || !(message.wasm instanceof ArrayBuffer)) {
                    throw new Error(`Invalid WASM data: ${typeof message.wasm}`);
                }
                const wasmBytes = new Uint8Array(message.wasm);
                await initializeImageMagick(wasmBytes);
                magickInitialized = true;
                self.postMessage({ type: 'loaded', id: message.id });
            } catch (error) {
                self.postMessage({
                    type: 'error',
                    error: `Error loading magick-wasm: ${error.message}`,
                    id: message.id
                });
            }
            break;
        }

        case 'convert': {
            try {
                if (!magickInitialized) {
                    self.postMessage({
                        type: 'error',
                        error: 'magick-wasm not initialized',
                        id: message.id
                    });
                    return;
                }

                const { input, to, quality, keepMetadata } = message;
                const file = input.file;
                let toExt = to;
                if (!toExt.startsWith('.')) toExt = `.${toExt}`;
                toExt = toExt.toLowerCase();

                // Normalize formats
                if (toExt === '.jfif') toExt = '.jpeg';
                let fromExt = input.from;
                if (fromExt === '.jfif') fromExt = '.jpeg';
                if (fromExt === '.fit') fromExt = '.fits';

                self.postMessage({ type: 'progress', progress: 20, id: message.id });

                const buffer = new Uint8Array(await file.arrayBuffer());

                // Create image
                const settings = new MagickReadSettings();
                settings.format = MagickFormat.Unknown;

                self.postMessage({ type: 'progress', progress: 40, id: message.id });

                const image = MagickImage.create(buffer, settings);

                self.postMessage({ type: 'progress', progress: 60, id: message.id });

                // Set output format
                const targetFormat = this.formatToMagickFormat(toExt);
                if (targetFormat === null) {
                    throw new Error(`Unsupported output format: ${toExt}`);
                }
                image.format(targetFormat);

                // Apply quality for JPEG/WebP
                if (quality !== undefined && quality !== null) {
                    const q = Math.min(100, Math.max(1, quality));
                    switch (targetFormat) {
                        case MagickFormat.Jpeg:
                        case MagickFormat.Jpg:
                            image.compressionQuality(q);
                            break;
                        case MagickFormat.WebP:
                            image.compressionQuality(q);
                            break;
                    }
                }

                // Strip metadata if not kept
                if (!keepMetadata) {
                    image.strip();
                }

                self.postMessage({ type: 'progress', progress: 80, id: message.id });

                // Get output as blob
                const outputBlob = image.writeToBlob();
                image.dispose();

                const result = await outputBlob.arrayBuffer();

                self.postMessage({
                    type: 'finished',
                    output: result,
                    isZip: false,
                    id: message.id
                });
            } catch (error) {
                self.postMessage({
                    type: 'error',
                    error: error.message,
                    id: message.id
                });
            }
            break;
        }
    }
};

// Helper to convert extension to MagickFormat
function formatToMagickFormat(ext) {
    switch (ext) {
        case '.png': return MagickFormat.Png;
        case '.jpg':
        case '.jpeg': return MagickFormat.Jpeg;
        case '.webp': return MagickFormat.WebP;
        case '.gif': return MagickFormat.Gif;
        case '.tiff':
        case '.tif': return MagickFormat.Tiff;
        case '.bmp': return MagickFormat.Bmp;
        case '.ico': return MagickFormat.Ico;
        case '.avif': return MagickFormat.Avif;
        case '.heic':
        case '.heif': return MagickFormat.Heic;
        case '.jxl': return MagickFormat.Jxl;
        case '.svg': return MagickFormat.Svg;
        case '.eps': return MagickFormat.Eps;
        case '.psd': return MagickFormat.Psd;
        case '.cur': return MagickFormat.Cur;
        case '.pdf': return MagickFormat.Pdf;
        case '.jp2': return MagickFormat.Jp2;
        case '.j2k': return MagickFormat.J2k;
        case '.mj2': return MagickFormat.Mj2;
        case '.dds': return MagickFormat.Dds;
        case '.exr': return MagickFormat.Exr;
        case '.hdr': return MagickFormat.Hdr;
        case '.pbm': return MagickFormat.Pbm;
        case '.pgm': return MagickFormat.Pgm;
        case '.ppm': return MagickFormat.Ppm;
        case '.pnm': return MagickFormat.Pnm;
        case '.png': return MagickFormat.Png;
        default: return null;
    }
}

self.onmessage = (e) => handleMessage(e.data);
