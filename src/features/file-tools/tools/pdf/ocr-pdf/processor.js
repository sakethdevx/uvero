/**
 * OCR PDF Processor
 * Uses pdfjs-dist for text extraction and pdf-lib for PDF rebuilding
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

/**
 * Process a PDF file for OCR text extraction
 * @param {File} file - The PDF file to process
 * @param {string} language - OCR language (used for future enhancements)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Result with blob, url, extractedText, totalPages, filename
 */
const processOCR = async (file, language, onProgress = () => {}) => {
    onProgress(5);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let allText = '';

    onProgress(10);

    // Extract text from each page using pdfjs
    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += `--- Page ${i} ---\n${pageText}\n\n`;
        onProgress(10 + (i / totalPages) * 60);
    }

    onProgress(75);

    // Rebuild the PDF with pdf-lib (preserves original content)
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress(100);

    return {
        blob,
        url: URL.createObjectURL(blob),
        extractedText: allText,
        totalPages,
        filename: `ocr_${file.name}`
    };
};

export const processor = { processOCR };
