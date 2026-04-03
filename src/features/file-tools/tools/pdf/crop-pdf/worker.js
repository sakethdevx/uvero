/**
 * PDF Crop Worker
 * Handles PDF cropping using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, options } = e.data;

    if (type !== 'crop') {
        return;
    }

    try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        // Determine which pages to crop
        let pageIndices;
        if (options.allPages) {
            pageIndices = pages.map((_, i) => i);
        } else {
            // Parse page range like "1-3,5,7-9"
            pageIndices = parsePageRange(options.pageRange, pages.length);
        }

        pageIndices.forEach(i => {
            if (i >= 0 && i < pages.length) {
                const page = pages[i];
                const { width, height } = page.getSize();
                // Set CropBox to trim margins
                const cropBox = {
                    x: options.left || 0,
                    y: options.bottom || 0,
                    width: width - (options.left || 0) - (options.right || 0),
                    height: height - (options.top || 0) - (options.bottom || 0)
                };
                page.setCropBox(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
            }
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF crop error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to crop PDF'
        });
    }
});

function parsePageRange(range, totalPages) {
    if (!range) return [];
    const indices = [];
    range.split(',').forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
            for (let i = start; i <= end && i < totalPages; i++) {
                if (i >= 0) indices.push(i);
            }
        } else {
            const idx = parseInt(part) - 1;
            if (idx >= 0 && idx < totalPages) indices.push(idx);
        }
    });
    return [...new Set(indices)].sort((a, b) => a - b);
}
