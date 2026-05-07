import * as pdfjsLib from 'pdfjs-dist';

let pdfLibInstance = null;
let pdfLibLoadingPromise = null;
let workerConfigured = false;

const configurePdfjsWorker = () => {
    if (workerConfigured) return;
    if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
        workerConfigured = true;
    }
};

export const loadPdfLib = async () => {
    if (pdfLibInstance) return pdfLibInstance;
    if (pdfLibLoadingPromise) return pdfLibLoadingPromise;

    pdfLibLoadingPromise = import('pdf-lib').then((module) => {
        pdfLibInstance = module;
        pdfLibLoadingPromise = null;
        return module;
    });

    return pdfLibLoadingPromise;
};

export const loadPdfjs = async () => {
    configurePdfjsWorker();
    return pdfjsLib;
};

export const createPdfDocument = async () => {
    const pdfLib = await loadPdfLib();
    return pdfLib.PDFDocument.create();
};

export const loadPdfDocument = async (data) => {
    const pdfLib = await loadPdfLib();
    return pdfLib.PDFDocument.load(data, {
        ignoreEncryption: false,
        updateMetadata: false,
    });
};
