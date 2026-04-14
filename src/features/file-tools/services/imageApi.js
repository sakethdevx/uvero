/**
 * Image Processing API Service
 * Uses the local serverless image-processing endpoints for online mode.
 */

/**
 * Compress image using server-side API
 * Uploads to /api/compress endpoint for processing with Sharp
 */
export async function compressImageOnline(file, quality) {
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('quality', quality.toString());

        // Upload to our serverless API
        const response = await fetch('/api/compress', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Server compression failed');
        }

        // Get compression stats from headers
        const originalSize = parseInt(response.headers.get('X-Original-Size') || file.size);
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || 0);
        const reduction = parseInt(response.headers.get('X-Reduction') || 0);

        // Get the compressed image as blob
        const blob = await response.blob();

        return {
            blob,
            originalSize,
            compressedSize,
            reduction
        };
    } catch (error) {
        console.error('Online compression failed:', error);
        // Fallback to offline mode will be handled by the component
        throw new Error('Server compression unavailable. ' + error.message);
    }
}

async function transformImageOnline(file, operation, params = {}, extraFiles = {}) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('operation', operation);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value));
        }
    });

    Object.entries(extraFiles).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value);
        }
    });

    const response = await fetch('/api/transform-image', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Image transform failed.');
    }

    const blob = await response.blob();

    return {
        blob,
        originalSize: parseInt(response.headers.get('X-Original-Size') || file.size, 10),
        outputSize: parseInt(response.headers.get('X-Output-Size') || blob.size, 10),
        outputFormat: response.headers.get('X-Output-Format') || blob.type,
        dimensions: {
            original: {
                width: parseInt(response.headers.get('X-Original-Width') || 0, 10),
                height: parseInt(response.headers.get('X-Original-Height') || 0, 10),
            },
            converted: {
                width: parseInt(response.headers.get('X-Output-Width') || 0, 10),
                height: parseInt(response.headers.get('X-Output-Height') || 0, 10),
            },
        },
    };
}

export async function convertImageOnline(file, options = {}) {
    return transformImageOnline(file, 'convert', {
        outputFormat: options.outputFormat ?? options.format ?? 'png',
        width: options.width ?? null,
        height: options.height ?? null,
        maintainAspectRatio: options.maintainAspectRatio ?? true,
        quality: options.quality ?? null,
    });
}

export async function resizeImageOnline(file, options = {}) {
    return transformImageOnline(file, 'resize', {
        width: options.width ?? null,
        height: options.height ?? null,
    });
}

export async function watermarkImageOnline(file, options = {}) {
    return transformImageOnline(
        file,
        'watermark',
        {
            type: options.type ?? 'text',
            text: options.text ?? '',
            fontSize: options.fontSize ?? 48,
            opacity: options.opacity ?? 0.5,
            position: options.position ?? 'bottom-right',
            color: options.color ?? '#ffffff',
        },
        {
            watermarkImage: options.watermarkImage,
        }
    );
}

/**
 * Remove background using online API
 */
export async function removeBackgroundOnline() {
    // Remove.bg API (free tier: 50 images/month with API key)
    // For true free processing, use offline mode
    throw new Error('Online background removal requires API key. Use offline mode with AI model.');
}

/**
 * Check if online processing is available for a feature
 */
export function isOnlineFeatureAvailable(feature) {
    const availableFeatures = {
        compression: true,
        conversion: true,
        resize: true,
        watermark: true,
        backgroundRemoval: false,
    };

    return availableFeatures[feature] || false;
}
