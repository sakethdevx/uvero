import { loadPdfjs } from './pdfEngine';
import { loadFileAsArrayBuffer } from './pdfUtils';

/**
 * Generates a Data URL thumbnail of the first page of a PDF.
 * Uses lazy rendering locally inside the browser.
 * 
 * @param {File} file - The PDF file object
 * @param {number} width - Output width in pixels
 * @returns {Promise<string|null>} Resolves to a Data URL (image/jpeg) or null on failure
 */
export const generatePdfThumbnail = async (file, width = 200) => {
    try {
        const pdfjsLib = await loadPdfjs();
        const arrayBuffer = await loadFileAsArrayBuffer(file);

        // Load the document using local pdfjs worker
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Calculate scaling to constrain memory usage
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Render to a detached off-screen canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
            canvasContext: context,
            viewport: scaledViewport
        }).promise;

        // Memory cleanup: destroy objects appropriately
        await pdf.destroy();

        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Don't crash the UI, return null so a generic icon can be used
        return null;
    }
};