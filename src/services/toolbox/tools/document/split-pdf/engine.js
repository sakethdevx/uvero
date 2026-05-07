import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, generateMergedFilename, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { parsePageRanges, validatePageRanges, createSplitEveryPage, createSplitEveryNPages, generateSplitFilename } from '../shared/pageOperations/splitPages';

export const processSplit = async (files, options = {}, onProgress) => {
    const { splitMode = 'ranges', pageRanges = '', everyNPages = 1 } = options;

    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for splitting.');
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
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before splitting.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = sourcePdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    let ranges = [];

    if (splitMode === 'ranges') {
        if (!pageRanges || pageRanges.trim() === '') {
            throw new Error('At least one page range is required for splitting.');
        }
        ranges = parsePageRanges(pageRanges, totalPages);
    } else if (splitMode === 'individual') {
        ranges = createSplitEveryPage(totalPages);
    } else if (splitMode === 'every-n') {
        ranges = createSplitEveryNPages(totalPages, everyNPages);
    } else {
        throw new Error('Invalid split mode specified.');
    }

    const validationError = validatePageRanges(ranges, totalPages);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(20, `Validated ${ranges.length} page range(s).`);

    // Process each range
    const outputBlobs = [];
    const outputFilenames = [];
    const progressPerRange = 75 / ranges.length;

    for (let i = 0; i < ranges.length; i++) {
        if (onProgress) {
            const rangeProgress = 20 + (i * progressPerRange);
            onProgress(rangeProgress, `Extracting pages ${ranges[i].start}-${ranges[i].end}...`);
        }

        const range = ranges[i];

        // Create a new PDF for this range
        const newPdf = await createPdfDocument();

        // Get page indices (0-based)
        const pageIndices = [];
        for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
            pageIndices.push(pageNum - 1); // Convert to 0-based index
        }

        // Copy pages from source to new document
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        for (const page of copiedPages) {
            newPdf.addPage(page);
        }

        // Save the new PDF
        const pdfBytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        outputBlobs.push(blob);

        // Generate filename for this range
        const filename = generateSplitFilename(file.name, range, i + 1, ranges.length);
        outputFilenames.push(filename);
    }

    if (onProgress) onProgress(95, 'Finalizing...');

    // Return based on number of outputs
    if (outputBlobs.length === 1) {
        if (onProgress) onProgress(100, 'Complete!');
        return { 
            blob: outputBlobs[0], 
            filename: outputFilenames[0], 
            metadata: { 
                pageCount: outputFilenames[0].includes('page_') ? 1 : (ranges[0].end - ranges[0].start + 1),
                rangeCount: 1,
                sourcePageCount: totalPages,
                outputFiles: 1
            } 
        };
    }

    if (onProgress) onProgress(100, 'Complete!');

    return { 
        blob: outputBlobs, // Return array of blobs for multiple files
        filename: outputFilenames.join(', '), 
        metadata: { 
            rangeCount: ranges.length,
            sourcePageCount: totalPages,
            outputFiles: outputBlobs.length,
            outputFilenames: outputFilenames
        } 
    };
};