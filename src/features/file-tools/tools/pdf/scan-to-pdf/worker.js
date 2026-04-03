import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, images, options } = e.data;
    if (type !== 'convert') return;

    try {
        const pdfDoc = await PDFDocument.create();

        const pageSizes = {
            'a4': [595.28, 841.89],
            'letter': [612, 792],
            'legal': [612, 1008]
        };

        const marginValues = {
            'none': 0,
            'small': 20,
            'medium': 40,
            'large': 60
        };

        const margin = marginValues[options.margin] || 0;

        for (let i = 0; i < images.length; i++) {
            const imageData = images[i];
            let image;

            // Detect image type and embed
            try {
                image = await pdfDoc.embedJpg(imageData.data);
            } catch {
                try {
                    image = await pdfDoc.embedPng(imageData.data);
                } catch {
                    continue; // Skip unsupported format
                }
            }

            const imgWidth = image.width;
            const imgHeight = image.height;

            let pageWidth, pageHeight;

            if (options.pageSize === 'auto') {
                // Fit page to image
                pageWidth = imgWidth + margin * 2;
                pageHeight = imgHeight + margin * 2;
            } else {
                [pageWidth, pageHeight] = pageSizes[options.pageSize] || pageSizes['a4'];
                if (options.orientation === 'landscape') {
                    [pageWidth, pageHeight] = [pageHeight, pageWidth];
                } else if (options.orientation === 'auto') {
                    // Auto orientation based on image aspect ratio
                    if (imgWidth > imgHeight && pageWidth < pageHeight) {
                        [pageWidth, pageHeight] = [pageHeight, pageWidth];
                    }
                }
            }

            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Calculate image dimensions to fit within page margins
            const availWidth = pageWidth - margin * 2;
            const availHeight = pageHeight - margin * 2;
            const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight, 1);
            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;

            // Center the image
            const x = margin + (availWidth - drawWidth) / 2;
            const y = margin + (availHeight - drawHeight) / 2;

            page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });

            self.postMessage({ type: 'progress', progress: 10 + (i + 1) / images.length * 80 });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        self.postMessage({ type: 'success', data: { blob, totalPages: images.length } });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
});
