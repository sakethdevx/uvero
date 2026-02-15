/**
 * PDF Repair Worker
 * Handles PDF repair using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer } = e.data;

    if (type !== 'repair') {
        return;
    }

    try {
        // Try to load with ignoreEncryption and permissive settings
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false
        });

        // Create a new clean PDF
        const newPdf = await PDFDocument.create();
        const pageCount = pdfDoc.getPageCount();
        let pagesRecovered = 0;

        // Copy each page individually, skipping damaged ones
        for (let i = 0; i < pageCount; i++) {
            try {
                const [page] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(page);
                pagesRecovered++;
            } catch (err) {
                // Skip damaged page
                console.warn(`Page ${i + 1} could not be recovered`);
            }
        }

        // Copy metadata
        try {
            newPdf.setTitle(pdfDoc.getTitle() || '');
            newPdf.setAuthor(pdfDoc.getAuthor() || '');
        } catch (e) {
            // Metadata copy is optional
        }

        const pdfBytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: { blob, pagesRecovered, totalPages: pageCount }
        });
    } catch (error) {
        console.error('PDF repair error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to repair PDF'
        });
    }
});
