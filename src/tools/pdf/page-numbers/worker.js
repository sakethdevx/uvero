import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, options } = e.data;
    if (type !== 'addPageNumbers') return;
    try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
        };

        const color = hexToRgb(options.color || '#000000');
        const fontSize = options.fontSize || 12;
        const margin = options.margin || 30;
        const startNum = options.startNumber || 1;

        pages.forEach((page, index) => {
            const pageNum = startNum + index;
            const { width, height } = page.getSize();

            let text;
            switch (options.format) {
                case 'page': text = `Page ${pageNum}`; break;
                case 'of': text = `${pageNum} of ${totalPages}`; break;
                case 'dash': text = `- ${pageNum} -`; break;
                default: text = `${pageNum}`;
            }

            const textWidth = font.widthOfTextAtSize(text, fontSize);

            let x, y;
            switch (options.position) {
                case 'bottom-left': x = margin; y = margin; break;
                case 'bottom-right': x = width - textWidth - margin; y = margin; break;
                case 'top-center': x = (width - textWidth) / 2; y = height - margin; break;
                case 'top-left': x = margin; y = height - margin; break;
                case 'top-right': x = width - textWidth - margin; y = height - margin; break;
                default: x = (width - textWidth) / 2; y = margin; break; // bottom-center
            }

            page.drawText(text, { x, y, size: fontSize, font, color });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        self.postMessage({ type: 'success', data: blob });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
});
