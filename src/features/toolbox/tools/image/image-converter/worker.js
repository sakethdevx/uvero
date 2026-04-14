/**
 * Image Conversion Web Worker
 * Handles image format conversion and resizing off the main thread
 */

self.onmessage = async function (e) {
    const { file, outputFormat, width, height, maintainAspectRatio, quality } = e.data;

    try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });

        // Create an image bitmap for processing
        const imageBitmap = await createImageBitmap(blob);

        // Calculate dimensions
        let targetWidth = width || imageBitmap.width;
        let targetHeight = height || imageBitmap.height;

        if (maintainAspectRatio && (width || height)) {
            const aspectRatio = imageBitmap.width / imageBitmap.height;

            if (width && !height) {
                targetHeight = Math.round(width / aspectRatio);
            } else if (height && !width) {
                targetWidth = Math.round(height * aspectRatio);
            } else if (width && height) {
                // Fit within bounds while maintaining aspect ratio
                const widthRatio = width / imageBitmap.width;
                const heightRatio = height / imageBitmap.height;
                const ratio = Math.min(widthRatio, heightRatio);
                targetWidth = Math.round(imageBitmap.width * ratio);
                targetHeight = Math.round(imageBitmap.height * ratio);
            }
        }

        // Create offscreen canvas with target dimensions
        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');

        // Draw image to canvas with new dimensions
        ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

        // Determine output MIME type
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        };

        const outputType = mimeTypes[outputFormat.toLowerCase()] || 'image/png';

        // Convert to blob with specified format
        // quality param is 1-100; default 92 for JPEG, 100 (lossless) for PNG
        const qualityValue = quality !== undefined && quality !== null
            ? quality / 100
            : (outputType === 'image/jpeg' ? 0.92 : 1);
        const convertedBlob = await canvas.convertToBlob({
            type: outputType,
            quality: qualityValue
        });

        // Send result back to main thread
        self.postMessage({
            success: true,
            blob: convertedBlob,
            originalSize: file.size,
            convertedSize: convertedBlob.size,
            dimensions: {
                original: { width: imageBitmap.width, height: imageBitmap.height },
                converted: { width: targetWidth, height: targetHeight }
            }
        });

    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};
