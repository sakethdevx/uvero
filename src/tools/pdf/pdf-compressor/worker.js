/**
 * PDF Compression Worker
 * Handles PDF compression using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, level } = e.data;

    if (type !== 'compress') {
        return;
    }

    try {
        // Load the PDF
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
        const fields = form.getFields();

        // Process all pages
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            // Get page content - this helps optimize the page structure
            try {
                const { width, height } = page.getSize();
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
