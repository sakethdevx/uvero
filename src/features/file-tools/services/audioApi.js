import { createServiceUnavailableError } from '../core/errors';

/**
 * Audio Processing API Service
 * Uses the local serverless audio-processing endpoint for online mode.
 */

async function transformAudioOnline(file, operation, options = {}, onProgress) {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('operation', operation);

    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            formData.append(key, String(value));
        }
    });

    if (onProgress) onProgress(15);

    const response = await fetch('/api/transform-audio', {
        method: 'POST',
        body: formData,
    });

    if (onProgress) onProgress(80);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || 'Audio transformation failed.';
        const code = errorData.code || 'AUDIO_TRANSFORM_FAILED';

        if (response.status >= 500 || code === 'RUNTIME_NOT_FOUND' || code === 'RUNTIME_NOT_CONFIGURED') {
            throw createServiceUnavailableError('audio-tools', message, response.status || 503);
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    const outputFormat = response.headers.get('X-Output-Format') || options.outputFormat || 'mp3';
    const extension = outputFormat === 'mpeg' ? 'mp3' : outputFormat;
    const filename = `${file.name.replace(/\.[^/.]+$/, '')}.${extension}`;

    if (onProgress) onProgress(100);

    return {
        blob,
        filename,
        originalSize: parseInt(response.headers.get('X-Original-Size') || file.size, 10),
        outputSize: parseInt(response.headers.get('X-Output-Size') || blob.size, 10),
        duration: response.headers.get('X-Duration') || 'N/A',
        outputFormat,
        bitrate: parseInt(response.headers.get('X-Bitrate') || options.bitrate || 0, 10),
    };
}

export async function compressAudioOnline(file, options = {}, onProgress) {
    return transformAudioOnline(
        file,
        'compress',
        {
            bitrate: options.bitrate ?? 128,
        },
        onProgress
    );
}

export async function convertAudioOnline(file, options = {}, onProgress) {
    return transformAudioOnline(
        file,
        'convert',
        {
            outputFormat: options.outputFormat ?? options.format ?? 'mp3',
            bitrate: options.bitrate ?? 192,
        },
        onProgress
    );
}

export function isOnlineFeatureAvailable(feature) {
    const availableFeatures = {
        compression: true,
        conversion: true,
    };

    return availableFeatures[feature] || false;
}
