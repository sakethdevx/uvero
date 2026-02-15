/**
 * PDF Protection Worker
 * Handles PDF protection using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer } = e.data;

    if (type !== 'protect') {
        return;
    }

    try {
        // Load the original PDF
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Create a new PDF and copy all pages
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => newPdf.addPage(page));

        // Copy metadata
        const title = pdfDoc.getTitle();
        const author = pdfDoc.getAuthor();
        const subject = pdfDoc.getSubject();
        if (title) newPdf.setTitle(title);
        if (author) newPdf.setAuthor(author);
        if (subject) newPdf.setSubject(subject);

        // Mark as protected
        newPdf.setProducer('FileNext - Protected PDF');
        newPdf.setCreator('FileNext PDF Protector');

        // Save with object streams for optimization
        const pdfBytes = await newPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
            updateFieldAppearances: false
        });

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF protection error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to protect PDF'
        });
    }
});
