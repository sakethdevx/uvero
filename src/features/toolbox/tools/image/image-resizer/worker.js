/**
 * Image Resizer Worker
 * Handles image resizing using OffscreenCanvas
 */

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, width, height, mimeType } = e.data;

    if (type !== 'resize') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 10 });

        // Create blob from array buffer
        const blob = new Blob([arrayBuffer], { type: mimeType });

        self.postMessage({ type: 'progress', progress: 30 });

        // Create image bitmap
        const imageBitmap = await createImageBitmap(blob);

        self.postMessage({ type: 'progress', progress: 50 });

        // Create offscreen canvas with target dimensions
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw resized image
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        self.postMessage({ type: 'progress', progress: 70 });

        // Convert to blob
        const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
        const resizedBlob = await canvas.convertToBlob({
            type: mimeType,
            quality
        });

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: {
                blob: resizedBlob,
                width,
                height
            }
        });
    } catch (error) {
        console.error('Image resize error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to resize image'
        });
    }
});
