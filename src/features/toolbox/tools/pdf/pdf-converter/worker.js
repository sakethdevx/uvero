/**
 * PDF to Image Conversion Worker
 * Handles PDF rendering using PDF.js
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js for worker environment
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, format, pageRange, customPages } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const numPages = pdf.numPages;
        const pagesToConvert = getPageNumbers(pageRange, customPages, numPages);

        if (pagesToConvert.length === 0) {
            throw new Error('No valid pages specified');
        }

        const images = [];

        // Convert each page
        for (let i = 0; i < pagesToConvert.length; i++) {
            const pageNum = pagesToConvert[i];

            if (pageNum < 1 || pageNum > numPages) {
                continue; // Skip invalid page numbers
            }

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // 2x for better quality

            // Create canvas
            const canvas = new OffscreenCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            // Render page
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert to blob
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const quality = format === 'jpg' ? 0.92 : undefined;

            const blob = await canvas.convertToBlob({
                type: mimeType,
                quality: quality
            });

            images.push({
                blob: blob,
                size: blob.size,
                pageNumber: pageNum
            });
        }

        self.postMessage({
            type: 'success',
            data: images
        });
    } catch (error) {
        console.error('PDF conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert PDF to images'
        });
    }
});

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
            // Handle range (e.g., "5-7")
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    if (i >= 1 && i <= totalPages) {
                        pages.add(i);
                    }
                }
            }
        } else {
            // Handle single page
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}
