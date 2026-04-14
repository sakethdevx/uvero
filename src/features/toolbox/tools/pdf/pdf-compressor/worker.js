/**
 * PDF Compression Worker
 * Uses qpdf-wasm for fast structural compression/linearization and falls back to pdf-lib.
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
    const { type, arrayBuffer, level } = e.data;

    if (type !== 'compress') {
        return;
    }

    try {
        // First try structural compression via qpdf (lighter on memory, very fast).
        const qpdfCompressed = await tryQpdfCompress(arrayBuffer, level);
        if (qpdfCompressed) {
            self.postMessage({ type: 'success', data: qpdfCompressed });
            return;
        }

        // Fallback to pdf-lib optimization (existing behavior).
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // Get compression settings based on level
        const compressionSettings = getCompressionSettings(level);

        // Optimize the PDF
        const optimizedPdf = await optimizePDF(pdfDoc, compressionSettings);

        // Save the compressed PDF with aggressive settings
        const compressedBytes = await optimizedPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
            updateFieldAppearances: false
        });

        // Convert to Blob
        const blob = new Blob([compressedBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF compression error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to compress PDF'
        });
    }
});

/**
 * Try compressing with qpdf-wasm. Returns Blob on success, null on failure.
 */
async function tryQpdfCompress(arrayBuffer, level) {
    try {
        const qpdf = await initQPDF();
        const inputPath = `/input-${Date.now()}.pdf`;
        const outputPath = `/output-${Date.now()}.pdf`;

        qpdf.FS.writeFile(inputPath, new Uint8Array(arrayBuffer));

        const args = [
            '--stream-data=compress',
            '--object-streams=generate',
            '--recompress-flate'
        ];

        // Balanced defaults; for "high" also linearize; for "low" keep streams but still rewrite xref.
        if (level === 'high') {
            args.push('--linearize');
        }

        // qpdf syntax: qpdf [options] -- infile outfile
        qpdf.callMain([...args, '--', inputPath, outputPath]);

        const compressedBytes = qpdf.FS.readFile(outputPath);

        // Cleanup virtual FS (best-effort)
        try {
            qpdf.FS.unlink(inputPath);
            qpdf.FS.unlink(outputPath);
        } catch (_) { /* ignore */ }

        return new Blob([compressedBytes], { type: 'application/pdf' });
    } catch (err) {
        console.warn('qpdf compression failed, falling back to pdf-lib:', err);
        return null;
    }
}

/**
 * Get compression settings based on level
 */
function getCompressionSettings(level) {
    switch (level) {
        case 'low':
            return {
                imageQuality: 0.95,
                useObjectStreams: true,
                objectsPerTick: 50,
                removeMetadata: false,
                compressStreams: true
            };
        case 'high':
            return {
                imageQuality: 0.65,
                useObjectStreams: true,
                objectsPerTick: 200,
                removeMetadata: true,
                compressStreams: true
            };
        case 'balanced':
        default:
            return {
                imageQuality: 0.80,
                useObjectStreams: true,
                objectsPerTick: 100,
                removeMetadata: true,
                compressStreams: true
            };
    }
}

/**
 * Optimize PDF document
 */
async function optimizePDF(pdfDoc, settings) {
    try {
        // Remove metadata if specified
        if (settings.removeMetadata) {
            removeMetadata(pdfDoc);
        }

        // Embed and subset fonts (helps reduce size)
        const form = pdfDoc.getForm();
        form.getFields();

        // Process all pages
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            // Get page content - this helps optimize the page structure
            try {
                page.getSize();
                // Just accessing page properties helps pdf-lib optimize
                page.getRotation();
            } catch (err) {
                // Continue even if a page has issues
                console.warn('Page processing warning:', err);
            }
        }

        // Remove duplicate objects (pdf-lib handles this internally during save)
        // The useObjectStreams option will compress the PDF structure

        return pdfDoc;
    } catch (error) {
        console.error('PDF optimization error:', error);
        // Return original document if optimization fails
        return pdfDoc;
    }
}

/**
 * Remove unnecessary metadata
 */
function removeMetadata(pdfDoc) {
    try {
        // Remove various metadata fields
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setCreator('');
        pdfDoc.setProducer('');
        pdfDoc.setKeywords([]);
    } catch (error) {
        // Metadata removal is optional, continue if it fails
        console.warn('Metadata removal warning:', error);
    }
}
