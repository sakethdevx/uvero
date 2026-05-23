import { loadPdfLib } from '../shared/pdfEngine';
import { loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { extractMetadata } from '../shared/pdfMetadata/metadataExtractor';
import { cleanMetadata } from '../shared/pdfMetadata/metadataCleaner';
import { validateCleanupOptions } from '../shared/pdfMetadata/metadataValidation';
import { generateCleanedFilename } from '../shared/pdfMetadata/metadataUtils';
import { getProfileOptions } from '../shared/pdfMetadata/metadataProfiles';

export const processCleanMetadata = async (files, options = {}, onProgress) => {
    if (files.length !== 1) {
        throw new Error('Exactly 1 PDF file is required to clean metadata.');
    }

    const file = files[0];
    const { profile = 'full-clean', fieldsToRemove = [] } = options;

    let targetFields = [];
    if (profile === 'custom') {
        targetFields = fieldsToRemove;
    } else {
        targetFields = getProfileOptions(profile);
    }

    const validationError = validateCleanupOptions(targetFields);
    if (validationError) {
        throw new Error(validationError);
    }

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Reading PDF file...');

    const arrayBuffer = await loadFileAsArrayBuffer(file);
    const originalSize = arrayBuffer.byteLength;

    if (onProgress) onProgress(20, 'Loading PDF document...');

    let sourcePdf;
    try {
        sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
            ignoreEncryption: false,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('encrypt')) {
            throw new Error(`The PDF file "${file.name}" is encrypted. Please decrypt the file before removing metadata.`);
        }
        throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }

    const pageCount = sourcePdf.getPageCount();
    if (pageCount === 0) {
        throw new Error('The PDF file contains no pages. Cannot process an empty PDF.');
    }

    if (onProgress) onProgress(30, 'Reading current metadata...');

    const originalMetadata = extractMetadata(sourcePdf);

    if (onProgress) onProgress(50, 'Removing metadata...');

    const removedFields = cleanMetadata(sourcePdf, originalMetadata, targetFields);

    if (onProgress) onProgress(80, 'Saving PDF...');

    const cleanedPdfBytes = await sourcePdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    const blob = new Blob([new Uint8Array(cleanedPdfBytes)], { type: 'application/pdf' });
    const newSize = cleanedPdfBytes.length;

    if (onProgress) onProgress(100, 'Complete!');

    const outputFilename = generateCleanedFilename(file.name);

    return {
        blob,
        filename: outputFilename,
        metadata: {
            pageCount,
            originalSize,
            newSize,
            removedFields,
            originalMetadata,
        }
    };
};
