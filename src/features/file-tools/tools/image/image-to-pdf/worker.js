/**
 * Image to PDF Conversion Worker
 * Handles PDF creation using pdf-lib
 */

import { PDFDocument } from 'pdf-lib';

self.addEventListener('message', async (e) => {
    const { type, images, pageSize } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Process each image
        for (let i = 0; i < images.length; i++) {
            const imageData = images[i];

            // Embed the image
            let embeddedImage;
            if (imageData.type === 'image/png') {
                embeddedImage = await pdfDoc.embedPng(imageData.data);
            } else if (imageData.type === 'image/jpeg' || imageData.type === 'image/jpg') {
                embeddedImage = await pdfDoc.embedJpg(imageData.data);
            } else {
                // For WebP and other formats, we need to convert to PNG first
                const imageBitmap = await createImageBitmap(new Blob([imageData.data], { type: imageData.type }));
                const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imageBitmap, 0, 0);
                const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
                const pngArrayBuffer = await pngBlob.arrayBuffer();
                embeddedImage = await pdfDoc.embedPng(pngArrayBuffer);
            }

            const imageDims = embeddedImage.scale(1);

            // Determine page dimensions
            let pageWidth, pageHeight;

            if (pageSize === 'a4') {
                // A4: 595.28 × 841.89 points (210 × 297 mm)
                pageWidth = 595.28;
                pageHeight = 841.89;
            } else if (pageSize === 'letter') {
                // Letter: 612 × 792 points (8.5 × 11 inches)
                pageWidth = 612;
                pageHeight = 792;
            } else {
                // Fit to image
                pageWidth = imageDims.width;
                pageHeight = imageDims.height;
            }

            // Add a new page
            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Calculate image position and size to fit the page while maintaining aspect ratio
            if (pageSize === 'fit') {
                // Use original image dimensions
                page.drawImage(embeddedImage, {
                    x: 0,
                    y: 0,
                    width: imageDims.width,
                    height: imageDims.height,
                });
            } else {
                // Scale image to fit within page margins
                const margin = 40; // 40 points margin on each side
                const maxWidth = pageWidth - (margin * 2);
                const maxHeight = pageHeight - (margin * 2);

                const scale = Math.min(
                    maxWidth / imageDims.width,
                    maxHeight / imageDims.height,
                    1 // Don't scale up
                );

                const scaledWidth = imageDims.width * scale;
                const scaledHeight = imageDims.height * scale;

                // Center the image on the page
                const x = (pageWidth - scaledWidth) / 2;
                const y = (pageHeight - scaledHeight) / 2;

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: scaledWidth,
                    height: scaledHeight,
                });
            }
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF creation error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to create PDF'
        });
    }
});
