import { createServiceUnavailableError } from '../core/errors';

/**
 * Video Processing API Service
 * Uses the local serverless video-processing endpoint for online mode.
 */

async function transformVideoOnline(file, operation, options = {}, onProgress) {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('operation', operation);

    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value));
        }
    });

    if (onProgress) onProgress(15);

    const response = await fetch('/api/transform-video', {
        method: 'POST',
        body: formData,
    });

    if (onProgress) onProgress(80);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || 'Video transformation failed.';
        const code = errorData.code || 'VIDEO_TRANSFORM_FAILED';

        if (response.status >= 500 || code === 'RUNTIME_NOT_FOUND' || code === 'RUNTIME_NOT_CONFIGURED') {
            throw createServiceUnavailableError('video-tools', message, response.status || 503);
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    const outputFormat = response.headers.get('X-Output-Format') || options.outputFormat || 'mp4';
    const extension = outputFormat === 'quicktime' ? 'mov' : outputFormat;
    const filename = `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`;

    if (onProgress) onProgress(100);

    return {
        blob,
        filename,
        originalSize: parseInt(response.headers.get('X-Original-Size') || file.size, 10),
        outputSize: parseInt(response.headers.get('X-Output-Size') || blob.size, 10),
        duration: response.headers.get('X-Duration') || 'N/A',
        outputFormat,
    };
}

export async function compressVideoOnline(file, options = {}, onProgress) {
    return transformVideoOnline(
        file,
        'compress',
        {
            quality: options.quality ?? 'medium',
            resolution: options.resolution ?? 'original',
        },
        onProgress
    );
}

export async function convertVideoOnline(file, options = {}, onProgress) {
    return transformVideoOnline(
        file,
        'convert',
        {
            outputFormat: options.outputFormat ?? 'mp4',
            quality: options.quality ?? 'high',
        },
        onProgress
    );
}

export async function convertVideoToGifOnline(file, options = {}, onProgress) {
    return transformVideoOnline(
        file,
        'gif',
        {
            frameDelay: options.frameDelay ?? 100,
            quality: options.quality ?? 10,
            width: options.width ?? 480,
            loop: options.loop ?? 0,
        },
        onProgress
    );
}

export function isOnlineFeatureAvailable(feature) {
    const availableFeatures = {
        compression: true,
        conversion: true,
        gif: true,
    };

    return availableFeatures[feature] || false;
}
