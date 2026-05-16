import { loadPdfLib, createPdfDocument } from '../../pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../../pdfUtils';
import { PDF_ERROR_CODES } from '../../pdfConstants';
import { getSecuredFileName } from '../pdfSecurityUtils';

/**
 * Decrypt a password-protected PDF file
 * @param {File[]} files - Array of PDF files (single file expected)
 * @param {Object} options - Decryption options
 * @param {string} options.password - Password to decrypt the PDF
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with blob, filename, and metadata
 */
export const processDecrypt = async (files, options = {}, onProgress) => {
    const { password = '' } = options;

    if (files.length === 0) {
        throw new Error('No PDF file provided for decryption.');
    }

    if (files.length > 1) {
        throw new Error('Please select only one PDF file for decryption.');
    }

    const file = files[0];

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Reading PDF file...');
    const arrayBuffer = await loadFileAsArrayBuffer(file);

    let sourcePdf;
    try {
        sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
            password: password,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('password')) {
            throw new Error('Incorrect password. Please try again.');
        }
        if (error instanceof Error && error.message.includes('encrypt')) {
            throw new Error('The file is not encrypted or uses unsupported encryption.');
        }
        throw new Error(`Failed to load PDF: ${error.message}`);
    }

    if (onProgress) onProgress(20, 'PDF loaded successfully...');

    // Check if PDF is actually encrypted
    const isEncrypted = sourcePdf.encryptionLevel > 0;
    if (!isEncrypted) {
        throw new Error('The provided PDF is not encrypted.');
    }

    if (onProgress) onProgress(30, 'Creating decrypted document...');
    const decryptedPdf = await createPdfDocument();

    // Copy all pages from source to new document
    const copiedPages = await decryptedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices()
    );

    for (const page of copiedPages) {
        decryptedPdf.addPage(page);
    }

    // Copy metadata if needed
    try {
        const sourceMetadata = await sourcePdf.getMetadata();
        if (sourceMetadata) {
            decryptedPdf.setTitle(sourceMetadata.title);
            decryptedPdf.setAuthor(sourceMetadata.author);
            decryptedPdf.setSubject(sourceMetadata.subject);
            decryptedPdf.setKeywords(sourceMetadata.keywords);
            decryptedPdf.setCreator(sourceMetadata.creator);
            decryptedPdf.setProducer(sourceMetadata.producer);
            decryptedPdf.setCreationDate(sourceMetadata.creationDate);
            decryptedPdf.setModificationDate(sourceMetadata.modificationDate);
        }
    } catch (metaError) {
        // Continue without metadata if we can't read it
        console.warn('Could not copy metadata:', metaError);
    }

    if (onProgress) onProgress(80, 'Finalizing decrypted PDF...');

    // Save without encryption
    const decryptedPdfBytes = await decryptedPdf.save({
        useObjectStreams: true
    });

    if (onProgress) onProgress(90, 'Preparing output...');

    const blob = new Blob([new Uint8Array(decryptedPdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(100, 'Decryption complete!');

    const outputFilename = getSecuredFileName(file.name, 'decrypt');
    return { 
        blob, 
        filename: outputFilename, 
        metadata: { 
            pageCount: sourcePdf.getPageCount(),
            wasEncrypted: true,
            decrypted: true
        } 
    };
};
