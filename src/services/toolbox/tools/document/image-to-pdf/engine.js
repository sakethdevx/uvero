import { buildPdfFromImages } from '../shared/pdfComposition/imagePdfRenderer';

/**
 * Image to PDF Engine
 * Assembles a list of image blobs/arrayBuffers into a single PDF document.
 * 
 * @param {Array<{ bytes: Uint8Array, type: string }>} imageDataArray - Array of image objects
 * @param {Object} options - Layout configuration (pageSize, margin, orientation, etc.)
 * @returns {Promise<Uint8Array>} - The generated PDF document bytes
 */
export const executeImageToPdf = async (imageDataArray, options = {}) => {
    if (!imageDataArray || imageDataArray.length === 0) {
        throw new Error('No images provided for PDF generation.');
    }

    try {
        const enhancedOptions = {
            pageSize: 'A4',
            margin: 0,
            orientation: 'AUTO',
            scaleToFit: true,
            centerImage: true,
            ...options
        };

        const pdfBytes = await buildPdfFromImages(imageDataArray, enhancedOptions);
        return pdfBytes;
    } catch (error) {
        console.error('Error generating PDF from images:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
    }
};
