/**
 * Background Remover Processor
 * Uses AI-powered background removal library
 */

import { removeBackground } from '@imgly/background-removal';

class BackgroundRemoverProcessor {
    constructor() {
        this.processing = false;
    }

    async removeBackground(file, quality = 'medium', onProgress) {
        if (this.processing) {
            throw new Error('Already processing an image');
        }

        this.processing = true;

        try {
            if (onProgress) onProgress(10);

            // Configure the background removal
            const config = {
                model: quality === 'high' ? 'medium' : 'small',
                output: {
                    format: 'image/png',
                    quality: 1,
                    type: 'blob'
                },
                progress: (key, current, total) => {
                    // Report progress from the AI model
                    const percent = Math.round((current / total) * 90);
                    if (onProgress) onProgress(10 + percent);
                }
            };

            // Process the image with AI
            const blob = await removeBackground(file, config);

            if (onProgress) onProgress(100);

            // Create URL and metadata
            const url = URL.createObjectURL(blob);
            const filename = file.name.replace(/\.[^/.]+$/, '') + '_no_bg.png';

            // Get image dimensions
            const img = await this.loadImage(url);

            return {
                url,
                blob,
                filename,
                size: blob.size,
                width: img.width,
                height: img.height
            };

        } catch (error) {
            console.error('Background removal error:', error);
            throw new Error(error.message || 'Failed to remove background');
        } finally {
            this.processing = false;
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load processed image'));
            img.src = url;
        });
    }

    terminate() {
        // Cleanup if needed
        this.processing = false;
    }
}

export const processor = new BackgroundRemoverProcessor();
