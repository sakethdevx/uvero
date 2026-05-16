import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { validateReorderPageOrder, generateReorderFilename } from '../shared/pageOperations/reorderPages';

export const processReorder = async (files, options = {}, onProgress) => {
    const { newOrder = [] } = options;

    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for reordering.');
    }

    const file = files[0];

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Loading source PDF...');

    const arrayBuffer = await loadFileAsArrayBuffer(file);
    let sourcePdf;
    try {
        sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
            ignoreEncryption: false,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('encrypt')) {
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before reordering.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = sourcePdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    // Validate the new page order
    const validationError = validateReorderPageOrder(newOrder, totalPages);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(20, `Validated new page order for ${totalPages} pages.`);

    if (onProgress) onProgress(25, 'Creating new PDF with reordered pages...');

    // Create a new PDF document
    const newPdf = await createPdfDocument();

    // Copy pages in the new order
    for (let i = 0; i < newOrder.length; i++) {
        const originalPageIndex = newOrder[i]; // This is zero-based
        
        if (onProgress && i % 10 === 0) {
            const progress = 25 + Math.round((i / newOrder.length) * 45);
            onProgress(progress, `Reordering page ${i + 1} of ${newOrder.length}...`);
        }
        
        // Copy the page from the source PDF
        const copiedPages = await newPdf.copyPages(sourcePdf, [originalPageIndex]);
        for (const page of copiedPages) {
            newPdf.addPage(page);
        }
    }

    if (onProgress) onProgress(75, 'Saving the reordered PDF...');

    // Save the PDF
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(90, 'Finalizing...');
    if (onProgress) onProgress(100, 'Complete!');

    // Generate filename
    const baseName = getFileNameWithoutExtension(file.name);
    const filename = generateReorderFilename(file.name);

    return { 
        blob, 
        filename, 
        metadata: { 
            pageCount: totalPages,
            reorderApplied: true
        } 
    };
};