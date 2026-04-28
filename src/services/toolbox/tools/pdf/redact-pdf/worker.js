/**
 * PDF Redaction Worker
 * Handles PDF redaction using pdf-lib
 */

import { PDFDocument, rgb } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, redactions } = e.data;

    if (type === 'getInfo') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            self.postMessage({ type: 'info', totalPages: pdfDoc.getPageCount() });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
        return;
    }

    if (type === 'redact') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            redactions.forEach(r => {
                if (r.page >= 0 && r.page < pages.length) {
                    const page = pages[r.page];
                    const { height } = page.getSize();

                    const hexToRgb = (hex) => {
                        const rv = parseInt(hex.slice(1, 3), 16) / 255;
                        const gv = parseInt(hex.slice(3, 5), 16) / 255;
                        const bv = parseInt(hex.slice(5, 7), 16) / 255;
                        return rgb(rv, gv, bv);
                    };

                    // Draw a filled rectangle to cover the content
                    page.drawRectangle({
                        x: r.x,
                        y: height - r.y - r.height,
                        width: r.width,
                        height: r.height,
                        color: hexToRgb(r.color || '#000000'),
                        borderWidth: 0
                    });
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            self.postMessage({ type: 'success', data: blob });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
