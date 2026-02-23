/**
 * PDF Rotation Worker
 * Handles PDF page rotation using pdf-lib
 */

import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Parse a page specification string into an array of zero-based page indices.
 * Supports formats: 'all', '1,3,5', '1-3,5,7-9'
 */
function parsePageSpec(pageSpec, totalPages) {
    if (!pageSpec || pageSpec === 'all') {
        return Array.from({ length: totalPages }, (_, i) => i);
    }

    const indices = new Set();
    const parts = pageSpec.split(',').map((s) => s.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map((s) => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (isNaN(start) || isNaN(end)) continue;
            for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                indices.add(i - 1);
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num) && num >= 1 && num <= totalPages) {
                indices.add(num - 1);
            }
        }
    }

    return Array.from(indices).sort((a, b) => a - b);
}

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, angle, pageSpec } = e.data;

    if (type !== 'rotate') {
        return;
    }

    try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const pageIndices = parsePageSpec(pageSpec, pages.length);

        if (pageIndices.length === 0) {
            throw new Error('No valid pages specified for rotation.');
        }

        for (const idx of pageIndices) {
            const page = pages[idx];
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + angle));
        }

        const rotatedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
            updateFieldAppearances: false
        });

        const blob = new Blob([rotatedBytes], { type: 'application/pdf' });

        self.postMessage({ type: 'success', data: blob });
    } catch (error) {
        console.error('PDF rotation error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to rotate PDF'
        });
    }
});
