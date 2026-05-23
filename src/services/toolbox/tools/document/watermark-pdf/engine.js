import { loadPdfLib } from '../shared/pdfEngine';
import { loadFileAsArrayBuffer, getFileNameWithoutExtension } from '../shared/pdfUtils';
import { renderTextWatermark } from '../shared/pdfWatermark/watermarkRenderer';
import { validateWatermarkOptions } from '../shared/pdfWatermark/watermarkValidation';
import { parsePageRanges } from '../shared/pageOperations/pageSelectionUtils';

export const processWatermark = async (files, options = {}, onProgress) => {
    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required for watermarking.');
    }

    const file = files[0];

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Loading source PDF...');

    const arrayBuffer = await loadFileAsArrayBuffer(file);
    let pdf;
    try {
        pdf = await pdfLib.PDFDocument.load(arrayBuffer, {
            ignoreEncryption: false,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('encrypt')) {
            throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before watermarking.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const totalPages = pdf.getPageCount();
    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);

    const validationError = validateWatermarkOptions(options, totalPages);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(20, 'Preparing font...');

    // Fallback to StandardFonts.Helvetica
    const font = await pdf.embedFont(pdfLib.StandardFonts.HelveticaBold);

    // Determine which pages to process
    let pagesToProcess = [];
    if (options.pages === 'all' || !options.pages || options.pages.trim() === '') {
        for (let i = 0; i < totalPages; i++) {
            pagesToProcess.push(i);
        }
    } else {
        const ranges = parsePageRanges(options.pages, totalPages);
        const pageSet = new Set();
        for (const r of ranges) {
            for (let i = r.start - 1; i <= r.end - 1; i++) {
                pageSet.add(i);
            }
        }
        pagesToProcess = Array.from(pageSet).sort((a, b) => a - b);
    }

    if (onProgress) onProgress(30, 'Adding watermark...');

    for (let i = 0; i < pagesToProcess.length; i++) {
        const pageIndex = pagesToProcess[i];
        const page = pdf.getPage(pageIndex);

        renderTextWatermark(page, options.text, font, options, pdfLib);

        if (onProgress) {
            const progress = 30 + (60 * (i + 1) / pagesToProcess.length);
            onProgress(progress, `Processing page ${pageIndex + 1}...`);
        }
    }

    if (onProgress) onProgress(95, 'Saving PDF...');
    const pdfBytes = await pdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(100, 'Complete!');

    const baseName = getFileNameWithoutExtension(file.name);

    return {
        blob,
        filename: `${baseName}_watermarked.pdf`,
        metadata: {
            pageCount: totalPages,
            watermarkedPages: pagesToProcess.length
        }
    };
};
