/**
 * Image Cropper Worker
 * Crops images using Canvas API
 */

async function cropImage(imageBuffer, cropArea) {
    self.postMessage({ type: 'progress', progress: 20 });

    const { x, y, width, height } = cropArea;

    // Load image
    const blob = new Blob([imageBuffer]);
    const imageBitmap = await createImageBitmap(blob);

    self.postMessage({ type: 'progress', progress: 50 });

    // Validate crop area
    const cropX = Math.max(0, Math.min(x, imageBitmap.width));
    const cropY = Math.max(0, Math.min(y, imageBitmap.height));
    const cropWidth = Math.min(width, imageBitmap.width - cropX);
    const cropHeight = Math.min(height, imageBitmap.height - cropY);

    if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error('Invalid crop area');
    }

    self.postMessage({ type: 'progress', progress: 70 });

    // Create canvas for cropped image
    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext('2d');

    // Draw cropped portion
    ctx.drawImage(
        imageBitmap,
        cropX, cropY, cropWidth, cropHeight,  // Source
        0, 0, cropWidth, cropHeight            // Destination
    );

    self.postMessage({ type: 'progress', progress: 90 });

    // Convert to blob
    const resultBlob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });

    self.postMessage({ type: 'progress', progress: 100 });

    return resultBlob;
}

self.addEventListener('message', async (e) => {
    const { type, imageBuffer, cropArea } = e.data;

    if (type !== 'crop') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 10 });

        const blob = await cropImage(imageBuffer, cropArea);

        self.postMessage({
            type: 'success',
            data: { blob }
        });

    } catch (error) {
        console.error('Crop error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to crop image'
        });
    }
});