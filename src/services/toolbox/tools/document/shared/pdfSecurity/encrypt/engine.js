import { loadPdfLib, createPdfDocument } from '../../pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../../pdfUtils';
import { PDF_ERROR_CODES } from '../../pdfConstants';
import { getSecuredFileName } from '../pdfSecurityUtils';

/**
 * Encrypt PDF files with password protection and permissions
 * @param {File[]} files - Array of PDF files to encrypt
 * @param {Object} options - Encryption options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with blob, filename, and metadata
 */
export const processEncrypt = async (files, options = {}, onProgress) => {
    const { 
        ownerPassword = '',
        userPassword = '',
        permissions = 0,
        encryptionAlgorithm = 'AES_256'
    } = options;

    if (files.length === 0) {
        throw new Error('No PDF files provided for encryption.');
    }

    if (files.length > 1) {
        throw new Error('Please select only one PDF file for encryption.');
    }

    const file = files[0];

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Reading PDF file...');
    const arrayBuffer = await loadFileAsArrayBuffer(file);

    if (onProgress) onProgress(20, 'Loading PDF document...');
    let sourcePdf;
    try {
        sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
            ignoreEncryption: false,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('encrypt')) {
            throw new Error(`File "${file.name}" is already encrypted. Please decrypt it first before applying new encryption.`);
        }
        throw new Error(`Failed to load PDF "${file.name}": ${error.message}`);
    }

    if (onProgress) onProgress(30, 'Creating encrypted document...');
    const encryptedPdf = await pdfLib.PDFDocument.create();

    // Copy all pages from source to new document
    const copiedPages = await encryptedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices()
    );

    for (const page of copiedPages) {
        encryptedPdf.addPage(page);
    }

    // Copy metadata if needed
    try {
        const sourceMetadata = await sourcePdf.getMetadata();
        if (sourceMetadata) {
            encryptedPdf.setTitle(sourceMetadata.title);
            encryptedPdf.setAuthor(sourceMetadata.author);
            encryptedPdf.setSubject(sourceMetadata.subject);
            encryptedPdf.setKeywords(sourceMetadata.keywords);
            encryptedPdf.setCreator(sourceMetadata.creator);
            encryptedPdf.setProducer(sourceMetadata.producer);
            encryptedPdf.setCreationDate(sourceMetadata.creationDate);
            encryptedPdf.setModificationDate(sourceMetadata.modificationDate);
        }
    } catch (metaError) {
        // Continue without metadata if we can't read it
        console.warn('Could not copy metadata:', metaError);
    }

    if (onProgress) onProgress(80, 'Applying encryption...');

    // Save with encryption options
    const encryptedPdfBytes = await encryptedPdf.save({
        ownerPassword: ownerPassword,
        userPassword: userPassword,
        permissions: permissions,
        encryptionAlgorithm: encryptionAlgorithm,
        useObjectStreams: true
    });

    if (onProgress) onProgress(90, 'Finalizing encrypted PDF...');

    const blob = new Blob([new Uint8Array(encryptedPdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(100, 'Encryption complete!');

    const outputFilename = getSecuredFileName(file.name, 'encrypt');
    return { 
        blob, 
        filename: outputFilename, 
        metadata: { 
            pageCount: sourcePdf.getPageCount(),
            encrypted: true,
            hasOwnerPassword: !!ownerPassword,
            hasUserPassword: !!userPassword,
            permissions,
            encryptionAlgorithm
        } 
    };
};
