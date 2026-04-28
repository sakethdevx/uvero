import jsPDF from 'jspdf';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;

    if (!file.name.endsWith('.pptx')) {
        throw new Error('Currently only PPTX format is supported. PPT format requires server-side conversion.');
    }

    onProgress?.(10);
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(20);
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    onProgress?.(30);
    const slideFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    const slideCount = slideFiles.length;

    if (slideCount === 0) {
        throw new Error('No slides found in the presentation');
    }

    onProgress?.(40);
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const infoText = [
        'PowerPoint to PDF Conversion',
        '',
        `Presentation: ${file.name}`,
        `Slides: ${slideCount}`,
        '',
        'Note: Full slide rendering requires server-side processing.',
        'This client-side converter extracts basic information.',
        '',
        'For full conversion with slide content, images, and formatting,',
        'please use a dedicated PowerPoint viewer or server-based solution.',
    ];

    pdf.setFontSize(16);
    pdf.text('PowerPoint to PDF Converter', margin, margin + 10);

    pdf.setFontSize(12);
    let yPos = margin + 25;
    infoText.forEach((line) => {
        pdf.text(line, margin, yPos);
        yPos += 7;
    });

    onProgress?.(70);

    const maxPlaceholderSlides = 10;
    for (let index = 1; index <= Math.min(slideCount, maxPlaceholderSlides); index += 1) {
        pdf.addPage();
        pdf.setFontSize(24);
        pdf.text(`Slide ${index}`, pageWidth / 2, pageHeight / 2, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(
            'Content extraction from PPTX is limited in browser environment',
            pageWidth / 2,
            pageHeight / 2 + 10,
            { align: 'center' }
        );
    }

    onProgress?.(90);
    const pdfBlob = pdf.output('blob');
    const outputFile = new File([pdfBlob], file.name.replace(/\.(ppt|pptx)$/i, '.pdf'), {
        type: 'application/pdf',
    });

    onProgress?.(100);
    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        slideCount,
        note: 'Client-side placeholder conversion with slide metadata',
    });
}
