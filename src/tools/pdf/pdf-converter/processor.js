/**
 * PDF to Image Processor
 * Handles PDF rendering using PDF.js in main thread (PDF.js requires DOM access)
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

/**
 * Convert PDF to images
 * @param {File} file - The PDF file to convert
 * @param {string} format - Output format ('png' or 'jpg')
 * @param {string} pageRange - Page range ('all', 'first', 'custom')
 * @param {string} customPages - Custom page specification (e.g., "1,3,5-7")
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Array>} - Array of image objects with url and size
 */
const convert = async (file, format = 'png', pageRange = 'all', customPages = '', onProgress = () => { }) => {
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        onProgress(10);

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const numPages = pdf.numPages;
        const pagesToConvert = getPageNumbers(pageRange, customPages, numPages);

        if (pagesToConvert.length === 0) {
            throw new Error('No valid pages specified');
        }

        onProgress(20);

        const images = [];
        const progressPerPage = 70 / pagesToConvert.length;

        // Convert each page
        for (let i = 0; i < pagesToConvert.length; i++) {
            const pageNum = pagesToConvert[i];

            if (pageNum < 1 || pageNum > numPages) {
                continue;
            }

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Render page
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert to blob
            const blob = await new Promise((resolve) => {
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const quality = format === 'jpg' ? 0.92 : undefined;
                canvas.toBlob(resolve, mimeType, quality);
            });

            images.push({
                url: URL.createObjectURL(blob),
                size: blob.size,
                pageNumber: pageNum
            });

            onProgress(20 + (i + 1) * progressPerPage);
        }

        onProgress(100);
        return images;

    } catch (error) {
        console.error('PDF conversion error:', error);
        throw new Error(error.message || 'Failed to convert PDF to images');
    }
};

/**
 * Parse page range specification
 */
function getPageNumbers(pageRange, customPages, totalPages) {
    if (pageRange === 'all') {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (pageRange === 'first') {
        return [1];
    } else if (pageRange === 'custom' && customPages) {
        return parseCustomPages(customPages, totalPages);
    }
    return [];
}

/**
 * Parse custom page specification (e.g., "1,3,5-7")
 */
function parseCustomPages(customPages, totalPages) {
    const pages = new Set();
    const parts = customPages.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    if (i >= 1 && i <= totalPages) {
                        pages.add(i);
                    }
                }
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

export const processor = {
    convert
};
