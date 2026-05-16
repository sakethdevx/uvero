import * as pdfjsLib from 'pdfjs-dist';
import { loadPdfLib, loadPdfjs, createPdfDocument, loadPdfDocument } from './pdfEngine';

let pdfSecurityWorkerConfigured = false;

const configurePdfjsWorkerForSecurity = () => {
    if (pdfSecurityWorkerConfigured) return;
    if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
        pdfSecurityWorkerConfigured = true;
    }
};

export const loadPdfSecurityLib = async () => {
    // Reuse the existing pdf-lib loading mechanism
    return loadPdfLib();
};

export const loadPdfSecurityJs = async () => {
    configurePdfjsWorkerForSecurity();
    return loadPdfjs();
};

export const createSecuredPdfDocument = async (options = {}) => {
    const { 
        ownerPassword = '',
        userPassword = '',
        permissions = 0,
        encryptionAlgorithm = 'AES_256'
    } = options;
    
    const pdfLib = await loadPdfLib();
    
    // Create a new PDF document
    const pdfDoc = await pdfLib.PDFDocument.create();
    
    // Note: pdf-lib doesn't directly support setting encryption on creation
    // Encryption is typically applied when saving
    // We'll return the document and let the calling function handle encryption during save
    
    return {
        pdfDoc,
        securityOptions: {
            ownerPassword,
            userPassword,
            permissions,
            encryptionAlgorithm
        }
    };
};

export const loadSecuredPdfDocument = async (data, password = '') => {
    const pdfLib = await loadPdfLib();
    
    try {
        // Try to load the PDF with the provided password
        const pdfDoc = await pdfLib.PDFDocument.load(data, {
            password: password,
            ignoreEncryption: false,
            updateMetadata: false,
        });
        
        return pdfDoc;
    } catch (error) {
        if (error instanceof Error && error.message.includes('password')) {
            throw new Error('Invalid password. Please provide the correct password to open this PDF.');
        }
        throw error;
    }
};

export const isPdfEncrypted = async (data) => {
    const pdfLib = await loadPdfLib();
    
    try {
        // Try to load without password - if it fails due to encryption, it's encrypted
        await pdfLib.PDFDocument.load(data, {
            ignoreEncryption: false,
        });
        return false; // No encryption or successfully opened without password
    } catch (error) {
        if (error instanceof Error && 
            (error.message.includes('password') || error.message.includes('encrypt'))) {
            return true; // PDF is encrypted
        }
        throw error; // Re-throw other errors
    }
};

export const getPdfEncryptionInfo = async (data) => {
    const pdfjs = await loadPdfSecurityJs();
    
    try {
        const loadingTask = pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        
        // Get encryption info if available
        const encryptionInfo = await pdf.getEncryptionInfo();
        
        return {
            isEncrypted: pdf.encryption !== null,
            encryptionInfo: encryptionInfo
        };
    } catch (error) {
        throw new Error(`Failed to get PDF encryption info: ${error.message}`);
    }
};
