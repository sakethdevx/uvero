import { PDFDocument } from 'pdf-lib';
import { calculatePageDimensions, calculateImagePlacement } from './pageSizing';
import { DEFAULT_COMPOSITION_OPTIONS } from './compositionConstants';

export const convertImageToPngOrJpeg = async (imageBytes, type) => {
    // If it's already jpeg or png, return as is
    if (type === 'image/jpeg' || type === 'image/png') {
        return { bytes: imageBytes, type };
    }

    // In actual implementation (often done in UI thread before worker), we'd convert WebP/SVG to Canvas -> Blob -> ArrayBuffer.
    // Assuming for worker context we strictly rely on JPEG/PNG passing or basic error handling here.
    throw new Error(`Currently only JPEG and PNG are supported in the core renderer. Please convert ${type} before rendering.`);
};

export const buildPdfFromImages = async (imagesArray, options = {}) => {
    const mergedOptions = { ...DEFAULT_COMPOSITION_OPTIONS, ...options };
    const pdfDoc = await PDFDocument.create();

    for (const imageObj of imagesArray) {
        const { bytes, type } = imageObj;
        let pdfImage;

        try {
            if (type === 'image/jpeg' || type === 'image/jpg') {
                pdfImage = await pdfDoc.embedJpg(bytes);
            } else if (type === 'image/png') {
                pdfImage = await pdfDoc.embedPng(bytes);
            } else {
                throw new Error(`Unsupported image type for embedding: ${type}`);
            }
        } catch (error) {
            console.error('Failed to embed image:', error);
            throw new Error(`Failed to embed image of type ${type}: ${error.message}`);
        }

        const imgWidth = pdfImage.width;
        const imgHeight = pdfImage.height;

        const { pageWidth, pageHeight } = calculatePageDimensions(imgWidth, imgHeight, mergedOptions);
        const { x, y, width, height } = calculateImagePlacement(imgWidth, imgHeight, pageWidth, pageHeight, mergedOptions);

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(pdfImage, {
            x,
            y,
            width,
            height,
        });
    }

    return await pdfDoc.save();
};
