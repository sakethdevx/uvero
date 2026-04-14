/**
 * Online PDF handlers (API-backed).
 * These call stub service functions for now; extend with real API calls + keys.
 */
import {
    compressPDFOnline,
    htmlToPDFOnline,
    mergePDFsOnline,
    splitPDFOnline,
    wordToPDFOnline,
} from '../../services/pdfApi';

export async function runPdfOnline(operationId, payload) {
    switch (operationId) {
        case 'compress-pdf':
            return compressPDFOnline(payload.file, payload.options);
        case 'merge-pdf':
            return mergePDFsOnline(payload.files, payload.options);
        case 'split-pdf':
            return splitPDFOnline(payload.file, payload.options);
        case 'html-to-pdf':
            return htmlToPDFOnline(payload.file, payload.options);
        case 'word-to-pdf':
            return wordToPDFOnline(payload.file, payload.options);
        case 'pdf-to-word':
        case 'pdf-to-excel':
        case 'pdf-to-powerpoint':
        case 'convert-pdf':
        case 'ocr-pdf':
        case 'repair-pdf':
        case 'protect-pdf':
        case 'unlock-pdf':
        case 'rotate-pdf':
        case 'watermark-pdf':
        case 'page-numbers':
        case 'crop-pdf':
        default:
            throw new Error('Online mode is not yet implemented for this PDF tool. Please switch to offline.');
    }
}
