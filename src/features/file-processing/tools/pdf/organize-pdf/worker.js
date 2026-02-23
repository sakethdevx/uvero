import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, pageOrder } = e.data;

    if (type === 'getInfo') {
        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            self.postMessage({ type: 'info', totalPages: pdfDoc.getPageCount() });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
        return;
    }

    if (type === 'organize') {
        try {
            const srcDoc = await PDFDocument.load(arrayBuffer);
            const newDoc = await PDFDocument.create();

            const copiedPages = await newDoc.copyPages(srcDoc, pageOrder);
            copiedPages.forEach(page => newDoc.addPage(page));

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            self.postMessage({ type: 'success', data: blob });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
