import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { applyPageRotation, validatePageRangesForRotation, parsePageRanges, validateRotation } from '../shared/pageOperations/rotatePages';

export const processRotate = async (files, options = {}, onProgress) => {
    const { rotation = 90, pageRanges = '', rotateAll = false } = options;

    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for rotation.');
    }

    const file = files[0];

    // Validate rotation
    const rotationError = validateRotation(rotation);
    if (rotationError) {
        throw new Error(rotationError);
    }

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
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before rotating.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = sourcePdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    let ranges = [];
    let pagesToRotate = [];

    if (rotateAll) {
        // Rotate all pages
        pagesToRotate = [...Array(totalPages).keys()]; // [0, 1, 2, ..., totalPages-1]
        if (onProgress) onProgress(20, `Selected all ${totalPages} pages for rotation.`);
    } else {
        // Rotate specific pages/ranges
        if (!pageRanges || pageRanges.trim() === '') {
            throw new Error('Page selection is required for rotation.');
        }
        ranges = parsePageRanges(pageRanges, totalPages);
        
        const validationError = validatePageRangesForRotation(ranges, totalPages);
        if (validationError) {
            throw new Error(validationError);
        }

        // Convert ranges to zero-based page indices
        pagesToRotate = [];
        for (const range of ranges) {
            for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
                pagesToRotate.push(pageNum - 1); // Convert to 0-based index
            }
        }
        
        if (onProgress) onProgress(20, `Selected ${pagesToRotate.length} pages for rotation.`);
    }

    if (pagesToRotate.length === 0) {
        throw new Error('No pages selected for rotation.');
    }

    if (onProgress) onProgress(25, 'Applying rotation...');

    // Create a new PDF document
    const newPdf = await createPdfDocument();

    // Copy all pages from source
    const allPageIndices = [...Array(totalPages).keys()];
    const copiedPages = await newPdf.copyPages(sourcePdf, allPageIndices);
    
    // Add all pages to new document
    for (const page of copiedPages) {
        newPdf.addPage(page);
    }

    // Apply rotation to selected pages
    applyPageRotation(newPdf, pagesToRotate, rotation, pdfLib);

    if (onProgress) onProgress(80, 'Saving rotated PDF...');

    // Save the PDF
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(90, 'Finalizing...');
    if (onProgress) onProgress(100, 'Complete!');

    // Generate filename
    const baseName = getFileNameWithoutExtension(file.name);
    const filename = `${baseName}_rotated_${rotation}deg.pdf`;

    return { 
        blob, 
        filename, 
        metadata: { 
            pageCount: totalPages,
            rotatedPages: pagesToRotate.length,
            rotation: rotation,
            rotationMode: rotateAll ? 'all' : 'ranges'
        } 
    };
};