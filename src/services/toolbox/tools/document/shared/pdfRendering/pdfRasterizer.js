import { loadPdfjs } from '../pdfEngine';
import { loadFileAsArrayBuffer, getFileNameWithoutExtension } from '../pdfUtils';
import { canvasToBlob, buildImageFilename, releaseCanvas } from './imageExportUtils';
import { getRenderSettings, assertViewportWithinLimits } from './renderOptimization';
import { runSequentialRenderQueue } from './renderQueue';
import {
    normalizePdfToImageOptions,
    resolvePageSelection,
    validatePdfToImageFile,
} from './renderValidation';

const createRenderCanvas = (width, height) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(Math.ceil(width), Math.ceil(height));
    }

    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(width);
        canvas.height = Math.ceil(height);
        return canvas;
    }

    throw new Error('This browser does not support worker canvas rendering.');
};

const createPdfjsWorker = (pdfjsLib) => {
    if (typeof window !== 'undefined') {
        return null;
    }

    if (typeof Worker !== 'function' || !pdfjsLib.PDFWorker?.create) {
        throw new Error('This browser does not support isolated PDF rendering workers.');
    }

    const workerUrl = new URL('/workers/pdf.worker.min.mjs', globalThis.location?.href).href;
    const workerPort = new Worker(workerUrl, { type: 'module' });
    return pdfjsLib.PDFWorker.create({ port: workerPort });
};

const getPdfjsAssetUrl = (path) => (
    new URL(path, globalThis.location?.href).href
);

export const rasterizePdfToImages = async (files, options = {}, onProgress) => {
    const file = validatePdfToImageFile(files);
    const normalizedOptions = normalizePdfToImageOptions(options);
    const settings = getRenderSettings(normalizedOptions);
    const pdfjsLib = await loadPdfjs();
    const arrayBuffer = await loadFileAsArrayBuffer(file);
    let pdfDocument = null;
    let pdfWorker = null;

    try {
        if (onProgress) onProgress(8, 'Loading PDF...');
        pdfWorker = createPdfjsWorker(pdfjsLib);
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapPacked: true,
            cMapUrl: getPdfjsAssetUrl('/workers/pdfjs-cmaps/'),
            disableFontFace: true,
            standardFontDataUrl: getPdfjsAssetUrl('/workers/pdfjs-standard-fonts/'),
            useSystemFonts: false,
            useWorkerFetch: true,
            ...(pdfWorker ? { worker: pdfWorker } : {}),
        });
        pdfDocument = await loadingTask.promise;
        const totalPages = pdfDocument.numPages;
        const selectedPages = resolvePageSelection(normalizedOptions, totalPages);
        const baseName = getFileNameWithoutExtension(file.name);

        if (onProgress) {
            onProgress(15, `Exporting ${selectedPages.length} page${selectedPages.length === 1 ? '' : 's'}...`);
        }

        const images = await runSequentialRenderQueue(
            selectedPages,
            async (pageNumber) => {
                let canvas = null;
                let page = null;

                try {
                    page = await pdfDocument.getPage(pageNumber);
                    const viewport = page.getViewport({ scale: settings.scale });
                    assertViewportWithinLimits(viewport, settings, pageNumber);

                    canvas = createRenderCanvas(viewport.width, viewport.height);
                    const context = canvas.getContext('2d', { alpha: false });
                    if (!context) {
                        throw new Error('Unable to initialize page renderer.');
                    }

                    context.save();
                    context.fillStyle = normalizedOptions.backgroundColor;
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.restore();

                    await page.render({
                        canvasContext: context,
                        viewport,
                    }).promise;

                    const blob = await canvasToBlob(
                        canvas,
                        normalizedOptions.format,
                        settings.imageQuality
                    );

                    return {
                        blob,
                        pageNumber,
                        filename: buildImageFilename(
                            baseName,
                            pageNumber,
                            normalizedOptions.format,
                            totalPages
                        ),
                    };
                } finally {
                    if (page?.cleanup) page.cleanup();
                    releaseCanvas(canvas);
                }
            },
            (index, total, pageNumber) => {
                if (!onProgress) return;
                const percentage = 15 + Math.round((index / total) * 75);
                onProgress(percentage, `Rendering page ${pageNumber} (${index + 1} of ${total})...`);
            }
        );

        if (onProgress) onProgress(92, 'Preparing downloads...');

        return {
            images,
            baseName,
            totalPages,
            selectedPages,
            format: normalizedOptions.format,
            qualityPreset: normalizedOptions.qualityPreset,
            settings,
        };
    } catch (error) {
        if (error?.name === 'PasswordException') {
            throw new Error('This PDF is encrypted. Unlock it before exporting pages as images.');
        }
        throw new Error(error.message || 'Failed to rasterize PDF pages.');
    } finally {
        if (pdfDocument) {
            await pdfDocument.destroy();
        }
        if (pdfWorker) {
            pdfWorker.destroy();
        }
    }
};
