import { rasterizePdfToImages } from '../shared/pdfRendering/pdfRasterizer';
import { createImagesZip, getImageExtension } from '../shared/pdfRendering/imageExportUtils';

export const processPdfToImage = async (files, options = {}, onProgress) => {
    const result = await rasterizePdfToImages(files, options, onProgress);
    const { images, baseName, selectedPages, totalPages, format, qualityPreset, settings } = result;

    if (images.length === 1) {
        if (onProgress) onProgress(100, 'Export complete.');
        const image = images[0];
        return {
            blob: image.blob,
            filename: image.filename,
            outputType: 'image',
            metadata: {
                pageCount: 1,
                selectedPages,
                totalPages,
                format,
                qualityPreset,
                dpi: settings.dpi,
            },
        };
    }

    const extension = getImageExtension(format);
    const zipFilename = `${baseName}_${selectedPages.length}-pages_${extension}.zip`;
    const zipBlob = await createImagesZip(images, zipFilename, (zipProgress, message) => {
        if (!onProgress) return;
        const percentage = 92 + Math.round((zipProgress / 100) * 7);
        onProgress(Math.min(99, percentage), message);
    });

    if (onProgress) onProgress(100, 'Export complete.');

    return {
        blob: zipBlob,
        filename: zipFilename,
        outputType: 'zip',
        metadata: {
            pageCount: images.length,
            selectedPages,
            totalPages,
            format,
            qualityPreset,
            dpi: settings.dpi,
        },
    };
};
