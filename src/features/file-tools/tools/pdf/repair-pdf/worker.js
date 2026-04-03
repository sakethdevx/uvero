/**
 * PDF Repair Worker
 * First tries qpdf-wasm to rebuild/linearize; falls back to pdf-lib page copy if needed.
 */

import { PDFDocument } from 'pdf-lib';
import createQPDFModule from '@neslinesli93/qpdf-wasm';
import wasmUrl from '@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url';

let qpdfInstance = null;

const initQPDF = async () => {
    if (!qpdfInstance) {
        qpdfInstance = await createQPDFModule({
            locateFile: () => wasmUrl,
            noInitialRun: true
        });
    }
    return qpdfInstance;
};

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer } = e.data;

    if (type !== 'repair') {
        return;
    }

    try {
        // Prefer qpdf rebuild for broken xrefs/structures.
        const repairedByQpdf = await tryQpdfRepair(arrayBuffer);
        if (repairedByQpdf) {
            self.postMessage({ type: 'success', data: repairedByQpdf });
            return;
        }

        // Fallback to pdf-lib page-by-page copy
        const fallback = await repairWithPdfLib(arrayBuffer);
        self.postMessage({ type: 'success', data: fallback });
    } catch (error) {
        console.error('PDF repair error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to repair PDF'
        });
    }
});

async function tryQpdfRepair(arrayBuffer) {
    try {
        const qpdf = await initQPDF();
        const inputPath = `/repair-in-${Date.now()}.pdf`;
        const outputPath = `/repair-out-${Date.now()}.pdf`;
        qpdf.FS.writeFile(inputPath, new Uint8Array(arrayBuffer));

        // --linearize rewrites xref/objects; --remove-unreferenced-resources cleans dangling refs.
        const args = [
            '--linearize',
            '--remove-unreferenced-resources=yes',
            '--recompress-flate',
            '--object-streams=generate',
            '--',
            inputPath,
            outputPath
        ];

        qpdf.callMain(args);

        const repairedBytes = qpdf.FS.readFile(outputPath);

        // Use pdf-lib to count pages for reporting
        const pdfDoc = await PDFDocument.load(repairedBytes, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();

        try {
            qpdf.FS.unlink(inputPath);
            qpdf.FS.unlink(outputPath);
        } catch (_) { /* ignore */ }

        const blob = new Blob([repairedBytes], { type: 'application/pdf' });
        return {
            blob,
            pagesRecovered: totalPages,
            totalPages
        };
    } catch (err) {
        console.warn('qpdf repair failed, falling back to pdf-lib:', err);
        return null;
    }
}

async function repairWithPdfLib(arrayBuffer) {
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
        } catch {
            // Skip damaged page
            console.warn(`Page ${i + 1} could not be recovered`);
        }
    }

    // Copy metadata
    try {
        newPdf.setTitle(pdfDoc.getTitle() || '');
        newPdf.setAuthor(pdfDoc.getAuthor() || '');
    } catch {
        // Metadata copy is optional
    }

    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    return { blob, pagesRecovered, totalPages: pageCount };
}
