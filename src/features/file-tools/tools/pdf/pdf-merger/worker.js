/**
 * PDF Merger Worker
 * Handles merging multiple PDFs using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, pdfs } = e.data;

    if (type !== 'merge') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 5 });

        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();
        let totalPages = 0;

        // Process each PDF
        for (let i = 0; i < pdfs.length; i++) {
            const pdfBytes = pdfs[i];

            self.postMessage({
                type: 'progress',
                progress: 5 + (i / pdfs.length) * 80
            });

            try {
                // Load the PDF
                const pdf = await PDFDocument.load(pdfBytes);
                const pageCount = pdf.getPageCount();
                totalPages += pageCount;

                // Copy all pages from this PDF
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

                // Add each copied page to the merged document
                for (const page of copiedPages) {
                    mergedPdf.addPage(page);
                }
            } catch (error) {
                console.error(`Error processing PDF ${i + 1}:`, error);
                throw new Error(`Failed to process PDF file ${i + 1}: ${error.message}`);
            }
        }

        self.postMessage({ type: 'progress', progress: 90 });

        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: {
                blob,
                totalPages
            }
        });
    } catch (error) {
        console.error('PDF merge error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to merge PDFs'
        });
    }
});
