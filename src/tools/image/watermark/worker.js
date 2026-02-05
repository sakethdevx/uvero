/**
 * Watermark Worker
 * Adds text or image watermarks to images using Canvas
 */

// Position calculations
const getWatermarkPosition = (imgWidth, imgHeight, wmWidth, wmHeight, position) => {
    const padding = 30;

    const positions = {
        'top-left': { x: padding, y: padding },
        'top-center': { x: (imgWidth - wmWidth) / 2, y: padding },
        'top-right': { x: imgWidth - wmWidth - padding, y: padding },
        'center-left': { x: padding, y: (imgHeight - wmHeight) / 2 },
        'center': { x: (imgWidth - wmWidth) / 2, y: (imgHeight - wmHeight) / 2 },
        'center-right': { x: imgWidth - wmWidth - padding, y: (imgHeight - wmHeight) / 2 },
        'bottom-left': { x: padding, y: imgHeight - wmHeight - padding },
        'bottom-center': { x: (imgWidth - wmWidth) / 2, y: imgHeight - wmHeight - padding },
        'bottom-right': { x: imgWidth - wmWidth - padding, y: imgHeight - wmHeight - padding }
    };

    return positions[position] || positions['bottom-right'];
};

async function addTextWatermark(imageBuffer, options) {
    self.postMessage({ type: 'progress', progress: 20 });

    const { text, fontSize, opacity, position, color } = options;

    // Load image
    const blob = new Blob([imageBuffer]);
    const imageBitmap = await createImageBitmap(blob);

    self.postMessage({ type: 'progress', progress: 40 });

    // Create canvas
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(imageBitmap, 0, 0);

    self.postMessage({ type: 'progress', progress: 60 });

    // Prepare text watermark
    ctx.globalAlpha = opacity;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.strokeStyle = color === '#ffffff' ? '#000000' : '#ffffff';
    ctx.lineWidth = 2;

    // Measure text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    // Get position
    const pos = getWatermarkPosition(
        imageBitmap.width,
        imageBitmap.height,
        textWidth,
        textHeight,
        position
    );

    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw stroke (outline) for better visibility
    ctx.strokeText(text, pos.x, pos.y + fontSize);

    // Draw filled text
    ctx.shadowBlur = 0;
    ctx.fillText(text, pos.x, pos.y + fontSize);

    self.postMessage({ type: 'progress', progress: 80 });

    // Convert to blob
    const resultBlob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });

    self.postMessage({ type: 'progress', progress: 100 });

    return resultBlob;
}

async function addImageWatermark(imageBuffer, watermarkBuffer, options) {
    self.postMessage({ type: 'progress', progress: 20 });

    const { opacity, position } = options;

    // Load main image
    const imageBlob = new Blob([imageBuffer]);
    const imageBitmap = await createImageBitmap(imageBlob);

    self.postMessage({ type: 'progress', progress: 40 });

    // Load watermark image
    const watermarkBlob = new Blob([watermarkBuffer]);
    const watermarkBitmap = await createImageBitmap(watermarkBlob);

    self.postMessage({ type: 'progress', progress: 60 });

    // Create canvas
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(imageBitmap, 0, 0);

    // Calculate watermark size (max 25% of image width)
    const maxWatermarkWidth = imageBitmap.width * 0.25;
    const watermarkScale = Math.min(1, maxWatermarkWidth / watermarkBitmap.width);
    const watermarkWidth = watermarkBitmap.width * watermarkScale;
    const watermarkHeight = watermarkBitmap.height * watermarkScale;

    // Get position
    const pos = getWatermarkPosition(
        imageBitmap.width,
        imageBitmap.height,
        watermarkWidth,
        watermarkHeight,
        position
    );

    // Draw watermark
    ctx.globalAlpha = opacity;
    ctx.drawImage(
        watermarkBitmap,
        pos.x,
        pos.y,
        watermarkWidth,
        watermarkHeight
    );

    self.postMessage({ type: 'progress', progress: 80 });

    // Convert to blob
    const resultBlob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });

    self.postMessage({ type: 'progress', progress: 100 });

    return resultBlob;
}

self.addEventListener('message', async (e) => {
    const { type, imageBuffer, watermarkBuffer, options } = e.data;

    if (type !== 'addWatermark') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 10 });

        let blob;
        if (options.type === 'text') {
            blob = await addTextWatermark(imageBuffer, options);
        } else {
            blob = await addImageWatermark(imageBuffer, watermarkBuffer, options);
        }

        self.postMessage({
            type: 'success',
            data: { blob }
        });

    } catch (error) {
        console.error('Watermark error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to add watermark'
        });
    }
});