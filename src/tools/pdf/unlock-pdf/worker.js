/**
 * PDF Unlock Worker
 * Handles PDF unlocking using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, password } = e.data;

    if (type !== 'unlock') {
        return;
    }

    try {
        // Try to load the PDF with the provided password
        const loadOptions = {};
        if (password) {
            loadOptions.password = password;
            loadOptions.ignoreEncryption = true;
        }
        const pdfDoc = await PDFDocument.load(arrayBuffer, loadOptions);

        // Create a new clean PDF without encryption
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

        newPdf.setProducer('FileNext - Unlocked PDF');

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
        console.error('PDF unlock error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to unlock PDF. Check your password.'
        });
    }
});
