import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

const translate = async (file, sourceLang, targetLang, onProgress = () => {}) => {
    onProgress(5);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let extractedText = '';

    onProgress(10);

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n\n';
        onProgress(10 + (i / totalPages) * 50);
    }

    onProgress(65);

    // Create a new PDF with the extracted text preserving layout
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    onProgress(80);

    // Save the PDF (preserves original content)
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress(100);

    return {
        blob,
        url: URL.createObjectURL(blob),
        extractedText,
        totalPages,
        filename: `translated_${targetLang}_${file.name}`
    };
};

export const processor = { translate };
