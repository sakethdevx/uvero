import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { parsePageRanges, validatePageRangesForExtraction, getPagesToExtract, generateExtractFilename } from '../shared/pageOperations/extractPages';

export const processExtract = async (files, options = {}, onProgress) => {
    const { pageRanges = '' } = options;

    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for extraction.');
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
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before extracting.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = sourcePdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    if (!pageRanges || pageRanges.trim() === '') {
        throw new Error('Page selection is required for extraction.');
    }

    const ranges = parsePageRanges(pageRanges, totalPages);
    const validationError = validatePageRangesForExtraction(ranges, totalPages);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(20, `Validated ${ranges.length} page range(s).`);

    // Get the zero-based page indices to extract
    const pagesToExtract = getPagesToExtract(ranges);
    if (onProgress) onProgress(25, `Extracting ${pagesToExtract.length} pages...`);

    // Create a new PDF document
    const newPdf = await createPdfDocument();

    // Adaptive progress update: aim for ~20 updates during extraction
    const progressStep = Math.max(1, Math.floor(pagesToExtract.length / 20));

    // Copy the selected pages from the source PDF
    for (let i = 0; i < pagesToExtract.length; i++) {
        const originalPageIndex = pagesToExtract[i];

        if (onProgress && (i % progressStep === 0 || i === pagesToExtract.length - 1)) {
            const progress = 25 + Math.round((i / pagesToExtract.length) * 45);
            onProgress(progress, `Extracting page ${i + 1} of ${pagesToExtract.length}...`);
        }

        // Copy the page from the source PDF
        const copiedPages = await newPdf.copyPages(sourcePdf, [originalPageIndex]);
        for (const page of copiedPages) {
            newPdf.addPage(page);
        }
    }

    if (onProgress) onProgress(75, 'Saving the extracted PDF...');

    // Save the PDF
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(90, 'Finalizing...');
    if (onProgress) onProgress(100, 'Complete!');

    // Generate filename
    const filename = generateExtractFilename(file.name);

    return {
        blob,
        filename,
        metadata: {
            pageCount: pagesToExtract.length,
            sourcePageCount: totalPages
        }
    };
};