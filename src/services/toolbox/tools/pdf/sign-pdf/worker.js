/**
 * PDF Sign Worker
 * Handles PDF signature embedding using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, signatureData, options } = e.data;

    if (type === 'getInfo') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            self.postMessage({ type: 'info', totalPages: pdfDoc.getPageCount() });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
        return;
    }

    if (type === 'sign') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Convert base64 data URL to bytes
            const base64Data = signatureData.split(',')[1];
            const signatureBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Embed as PNG
            const signatureImage = await pdfDoc.embedPng(signatureBytes);

            const page = pdfDoc.getPages()[options.page || 0];
            const { height } = page.getSize();

            page.drawImage(signatureImage, {
                x: options.x || 50,
                y: height - (options.y || 100) - (options.height || 50),
                width: options.width || 150,
                height: options.height || 50
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            self.postMessage({ type: 'success', data: blob });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
