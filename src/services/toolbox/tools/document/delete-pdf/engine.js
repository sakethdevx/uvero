import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { parsePageRanges, validatePageRangesForDeletion, getPagesToKeep, generateDeleteFilename } from '../shared/pageOperations/removePages';

export const processDelete = async (files, options = {}, onProgress) => {
    const { pageRanges = '' } = options;

    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for deletion.');
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
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before deleting pages.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = sourcePdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    let ranges = [];
    if (!pageRanges || pageRanges.trim() === '') {
        throw new Error('Page selection is required for deletion.');
    }
    ranges = parsePageRanges(pageRanges, totalPages);

    const validationError = validatePageRangesForDeletion(ranges, totalPages);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(20, `Validated ${ranges.length} page range(s) for deletion.`);

    // Determine which pages to keep
    const pagesToKeep = getPagesToKeep(ranges, totalPages);
    if (onProgress) onProgress(25, `Pages to keep: ${pagesToKeep.length}`);

    if (pagesToKeep.length === 0) {
        throw new Error('No pages remaining after deletion. At least one page must be kept.');
    }

    if (onProgress) onProgress(30, 'Creating new PDF with remaining pages...');

    // Create a new PDF document
    const newPdf = await createPdfDocument();

    // Copy the pages we want to keep from the source PDF
    const copiedPages = await newPdf.copyPages(sourcePdf, pagesToKeep);
    for (const page of copiedPages) {
        newPdf.addPage(page);
    }

    if (onProgress) onProgress(70, 'Saving the modified PDF...');

    // Save the PDF
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(90, 'Finalizing...');
    if (onProgress) onProgress(100, 'Complete!');

    // Generate filename
    const baseName = getFileNameWithoutExtension(file.name);
    const filename = generateDeleteFilename(file.name);

    return { 
        blob, 
        filename, 
        metadata: { 
            pageCount: pagesToKeep.length,
            deletedPages: totalPages - pagesToKeep.length,
            originalPageCount: totalPages
        } 
    };
};