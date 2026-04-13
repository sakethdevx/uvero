import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;

    onProgress?.(10);

    const htmlContent = await file.text();
    onProgress?.(30);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '180mm';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '11pt';
    container.style.lineHeight = '1.6';
    container.style.backgroundColor = 'white';
    container.style.padding = '0';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        const images = container.querySelectorAll('img');
        await Promise.all(
            Array.from(images).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }),
        );

        onProgress?.(50);

        const fullCanvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        onProgress?.(70);

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
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
            pageCtx.drawImage(
                fullCanvas,
                0,
                sourceY,
                fullCanvas.width,
                pageCanvas.height,
                0,
                0,
                pageCanvas.width,
                pageCanvas.height,
            );

            const pageImgData = pageCanvas.toDataURL('image/png');
            const thisPageHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, thisPageHeight);

            yPosition += contentHeight;
            pageNumber += 1;
        }

        onProgress?.(90);

        const pdfBlob = pdf.output('blob');
        const outputFile = new File([pdfBlob], file.name.replace(/\.html?$/i, '.pdf'), {
            type: 'application/pdf',
        });

        onProgress?.(100);

        return normalizeSingleFileResult(outputFile, {
            outputSize: outputFile.size,
            pageCount: pageNumber,
        });
    } finally {
        document.body.removeChild(container);
    }
}
