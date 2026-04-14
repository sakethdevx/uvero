/**
 * Image Compression Web Worker
 * Handles heavy image processing off the main thread
 */

self.onmessage = async function (e) {
    const { file, quality } = e.data;

    try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });

        // Create an image bitmap for processing
        const imageBitmap = await createImageBitmap(blob);

        // Create offscreen canvas
        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');

        // Draw image to canvas
        ctx.drawImage(imageBitmap, 0, 0);

        // Determine output format
        let outputType = file.type;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            outputType = 'image/jpeg'; // Default to JPEG for unsupported formats
        }

        // Convert to blob with compression
        const compressedBlob = await canvas.convertToBlob({
            type: outputType,
            quality: quality / 100
        });

        // Send result back to main thread
        self.postMessage({
            success: true,
            blob: compressedBlob,
            originalSize: file.size,
            compressedSize: compressedBlob.size
        });

    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};
