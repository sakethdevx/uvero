/**
 * PDF Edit Worker
 * Handles PDF text annotation using pdf-lib
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, annotations } = e.data;

    if (type === 'getInfo') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            self.postMessage({ type: 'info', totalPages: pdfDoc.getPageCount() });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
        return;
    }

    if (type === 'edit') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            annotations.forEach(ann => {
                if (ann.type === 'text' && ann.page >= 0 && ann.page < pages.length) {
                    const page = pages[ann.page];
                    const { height } = page.getSize();

                    const hexToRgb = (hex) => {
                        const r = parseInt(hex.slice(1, 3), 16) / 255;
                        const g = parseInt(hex.slice(3, 5), 16) / 255;
                        const b = parseInt(hex.slice(5, 7), 16) / 255;
                        return rgb(r, g, b);
                    };

                    page.drawText(ann.content, {
                        x: ann.x || 50,
                        y: height - (ann.y || 50),
                        size: ann.fontSize || 12,
                        font,
                        color: hexToRgb(ann.color || '#000000')
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
