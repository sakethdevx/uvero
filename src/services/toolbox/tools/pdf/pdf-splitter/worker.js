/**
 * PDF Splitter Worker
 * Handles splitting PDFs using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, mode, spec, totalPages } = e.data;

    if (type === 'get-info') {
        try {
            const pdf = await PDFDocument.load(arrayBuffer);
            self.postMessage({
                type: 'info-success',
                data: { totalPages: pdf.getPageCount() }
            });
        } catch (error) {
            self.postMessage({
                type: 'info-error',
                error: error.message || 'Failed to read PDF'
            });
        }
        return;
    }

    if (type !== 'split') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 5 });

        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const pdfs = [];

        if (mode === 'all') {
            // Split every page into separate PDFs
            for (let i = 0; i < totalPages; i++) {
                self.postMessage({
                    type: 'progress',
                    progress: 5 + ((i + 1) / totalPages) * 85
                });

                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
                newPdf.addPage(copiedPage);

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                pdfs.push({
                    blob,
                    pageNumbers: [i + 1]
                });
            }
        } else if (mode === 'pages') {
            // Extract specific pages into one PDF
            const pageNumbers = parsePageSpec(spec, totalPages);

            if (pageNumbers.length === 0) {
                throw new Error('No valid pages specified');
            }

            self.postMessage({ type: 'progress', progress: 30 });

            const newPdf = await PDFDocument.create();
            const pageIndices = pageNumbers.map(n => n - 1);
            const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

            copiedPages.forEach(page => newPdf.addPage(page));

            self.postMessage({ type: 'progress', progress: 70 });

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            pdfs.push({
                blob,
                pageNumbers
            });
        } else if (mode === 'ranges') {
            // Split by ranges
            const ranges = parseRanges(spec, totalPages);

            if (ranges.length === 0) {
                throw new Error('No valid ranges specified');
            }

            for (let i = 0; i < ranges.length; i++) {
                self.postMessage({
                    type: 'progress',
                    progress: 5 + ((i + 1) / ranges.length) * 85
                });

                const range = ranges[i];
                const newPdf = await PDFDocument.create();
                const pageIndices = range.map(n => n - 1);
                const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);

                copiedPages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                pdfs.push({
                    blob,
                    pageNumbers: range
                });
            }
        }

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: { pdfs }
        });
    } catch (error) {
        console.error('PDF split error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to split PDF'
        });
    }
});

/**
 * Parse page specification (e.g., "1,3,5-7")
 */
function parsePageSpec(spec, totalPages) {
    const pages = new Set();
    const parts = spec.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    if (i >= 1 && i <= totalPages) {
                        pages.add(i);
                    }
                }
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                pages.add(pageNum);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Parse range specification (e.g., "1-5,6-10,11-15")
 */
function parseRanges(spec, totalPages) {
    const ranges = [];
    const parts = spec.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                const range = [];
                for (let i = start; i <= end; i++) {
                    range.push(i);
                }
                ranges.push(range);
            }
        }
    }

    return ranges;
}
