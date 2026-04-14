/**
 * PDF Watermark Worker
 * Handles adding watermarks to PDFs using pdf-lib
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, options } = e.data;

    if (type !== 'watermark') {
        return;
    }

    try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        if (options.type === 'text') {
            const hexColor = options.color || '#ff0000';
            const r = parseInt(hexColor.slice(1, 3), 16) / 255;
            const g = parseInt(hexColor.slice(3, 5), 16) / 255;
            const b = parseInt(hexColor.slice(5, 7), 16) / 255;

            const fontSize = options.fontSize || 48;
            const opacity = options.opacity || 0.3;
            const rotation = options.rotation || -45;
            const text = options.text || 'WATERMARK';

            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(text, fontSize);
                const textHeight = fontSize;

                const { x, y } = getPosition(options.position, width, height, textWidth, textHeight);

                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(r, g, b),
                    opacity,
                    rotate: degrees(rotation),
                });
            }
        } else if (options.type === 'image' && options.imageData) {
            let embeddedImage;
            const imageBytes = new Uint8Array(options.imageData);

            // Detect image type from PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
            const isPng = imageBytes[0] === 0x89 && imageBytes[1] === 0x50 &&
                imageBytes[2] === 0x4E && imageBytes[3] === 0x47;
            // JPEG starts with FF D8 FF
            const isJpeg = imageBytes[0] === 0xFF && imageBytes[1] === 0xD8 && imageBytes[2] === 0xFF;

            if (isPng) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else if (isJpeg) {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } else {
                throw new Error('Unsupported image format. Please use PNG or JPEG.');
            }

            const imgDims = embeddedImage.scale(0.5);
            const opacity = options.opacity || 0.3;

            for (const page of pages) {
                const { width, height } = page.getSize();
                const { x, y } = getPosition(options.position, width, height, imgDims.width, imgDims.height);

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: imgDims.width,
                    height: imgDims.height,
                    opacity,
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF watermark error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to add watermark to PDF'
        });
    }
});

/**
 * Calculate position coordinates for watermark placement
 */
function getPosition(position, pageWidth, pageHeight, itemWidth, itemHeight) {
    switch (position) {
        case 'top-left':
            return { x: 20, y: pageHeight - itemHeight - 20 };
        case 'top-right':
            return { x: pageWidth - itemWidth - 20, y: pageHeight - itemHeight - 20 };
        case 'bottom-left':
            return { x: 20, y: 20 };
        case 'bottom-right':
            return { x: pageWidth - itemWidth - 20, y: 20 };
        case 'diagonal':
            return { x: pageWidth / 4, y: pageHeight / 4 };
        case 'center':
        default:
            return { x: (pageWidth - itemWidth) / 2, y: (pageHeight - itemHeight) / 2 };
    }
}
