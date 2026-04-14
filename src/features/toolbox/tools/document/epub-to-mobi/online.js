import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';
import { createServiceUnavailableError } from '../../../core/errors';

export async function run({ files, onProgress }) {
    const [file] = ensureFiles(files);
    const formData = new FormData();
    formData.append('ebook', file);

    onProgress?.(15);

    const response = await fetch('/api/convert-epub-to-mobi', {
        method: 'POST',
        body: formData,
    });

    onProgress?.(70);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || 'EPUB to MOBI conversion failed.';
        const code = errorData.code;

        if (response.status >= 500 || code === 'RUNTIME_NOT_CONFIGURED' || code === 'RUNTIME_NOT_FOUND') {
            throw createServiceUnavailableError('epub-to-mobi', message, response.status);
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    const outputFile = new File([blob], `${file.name.replace(/\.epub$/i, '')}.mobi`, {
        type: 'application/x-mobipocket-ebook',
    });

    onProgress?.(100);

    return normalizeSingleFileResult(outputFile, {
        originalSize: file.size,
        outputSize: outputFile.size,
        note: `Converted with ${response.headers.get('X-Converter-Binary') || 'server-side MOBI runtime'}`,
    });
}
