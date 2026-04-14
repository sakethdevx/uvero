import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;

    if (!file.name.endsWith('.docx')) {
        throw new Error('Currently only DOCX format is supported. DOC format requires server-side conversion.');
    }

    onProgress?.(10);
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(20);
    const result = await mammoth.convertToHtml({ arrayBuffer });
    if (!result.value) {
        throw new Error('Failed to extract content from document');
    }

    onProgress?.(40);
    const fullContainer = document.createElement('div');
    fullContainer.style.position = 'absolute';
    fullContainer.style.left = '-9999px';
    fullContainer.style.width = '180mm';
    fullContainer.style.fontFamily = 'Arial, sans-serif';
    fullContainer.style.fontSize = '11pt';
    fullContainer.style.lineHeight = '1.6';
    fullContainer.style.backgroundColor = 'white';
    fullContainer.style.padding = '0';
    fullContainer.innerHTML = result.value;
    document.body.appendChild(fullContainer);

    try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress?.(50);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;

        const fullCanvas = await html2canvas(fullContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        onProgress?.(70);

        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (fullCanvas.height * imgWidth) / fullCanvas.width;
        const contentHeight = pageHeight - (2 * margin);

        let yPosition = 0;
        let pageNumber = 0;

        while (yPosition < imgHeight) {
            onProgress?.(70 + ((yPosition / imgHeight) * 20));

            if (pageNumber > 0) {
                pdf.addPage();
            }

            const sourceY = (yPosition / imgWidth) * fullCanvas.width * (fullCanvas.height / fullCanvas.width);
            const sourceHeight = (contentHeight / imgWidth) * fullCanvas.width;

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = fullCanvas.width;
            pageCanvas.height = Math.min(sourceHeight, fullCanvas.height - sourceY);

            const pageCtx = pageCanvas.getContext('2d');
            if (!pageCtx) {
                throw new Error('Failed to create canvas context for PDF conversion.');
            }

            pageCtx.drawImage(
                fullCanvas,
                0,
                sourceY,
                fullCanvas.width,
                pageCanvas.height,
                0,
                0,
                pageCanvas.width,
                pageCanvas.height
            );

            const pageImgData = pageCanvas.toDataURL('image/png');
            const thisPageHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, thisPageHeight);

            yPosition += contentHeight;
            pageNumber += 1;
        }

        onProgress?.(90);
        const pdfBlob = pdf.output('blob');
        const outputFile = new File([pdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), {
            type: 'application/pdf',
        });

        onProgress?.(100);
        return normalizeSingleFileResult(outputFile, {
            outputSize: outputFile.size,
            note: 'Converted from DOCX in browser',
        });
    } finally {
        document.body.removeChild(fullContainer);
    }
}
