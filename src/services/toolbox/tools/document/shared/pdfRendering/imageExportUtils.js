import JSZip from 'jszip';
import { PDF_IMAGE_EXTENSIONS, PDF_IMAGE_MIME_TYPES } from './renderConstants';

export const getImageMimeType = (format) => PDF_IMAGE_MIME_TYPES[format];

export const getImageExtension = (format) => PDF_IMAGE_EXTENSIONS[format];

export const canvasToBlob = async (canvas, format, quality) => {
    const mimeType = getImageMimeType(format);
    if (!mimeType) {
        throw new Error(`Unsupported image format: ${format}`);
    }

    if (typeof canvas.convertToBlob === 'function') {
        return canvas.convertToBlob({
            type: mimeType,
            quality,
        });
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to encode rendered page.'));
            },
            mimeType,
            quality
        );
    });
};

export const buildImageFilename = (baseName, pageNumber, format, totalPages) => {
    const extension = getImageExtension(format);
    const width = String(totalPages).length;
    const paddedPage = String(pageNumber).padStart(Math.max(width, 2), '0');
    return `${baseName}_page-${paddedPage}.${extension}`;
};

export const createImagesZip = async (images, zipName, onProgress) => {
    const zip = new JSZip();

    for (const image of images) {
        zip.file(image.filename, image.blob);
    }

    const blob = await zip.generateAsync(
        {
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        },
        (metadata) => {
            if (onProgress) {
                onProgress(metadata.percent || 0, `Packaging ${zipName}...`);
            }
        }
    );

    return blob;
};

export const releaseCanvas = (canvas) => {
    if (!canvas) return;
    canvas.width = 1;
    canvas.height = 1;
};
