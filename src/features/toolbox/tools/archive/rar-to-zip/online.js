import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';
import { createServiceUnavailableError } from '../../../core/errors';

export async function run({ files, onProgress }) {
    const [file] = ensureFiles(files);
    const formData = new FormData();
    formData.append('archive', file);

    onProgress?.(15);

    const response = await fetch('/api/convert-rar-to-zip', {
        method: 'POST',
        body: formData,
    });

    onProgress?.(70);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || 'RAR to ZIP conversion failed.';
        const code = errorData.code;

        if (response.status >= 500 || code === 'RUNTIME_NOT_CONFIGURED' || code === 'RUNTIME_NOT_FOUND') {
            throw createServiceUnavailableError('rar-to-zip', message, response.status);
        }

        throw new Error(message);
    }

    const blob = await response.blob();
    const outputFile = new File([blob], `${file.name.replace(/\.rar$/i, '')}.zip`, {
        type: 'application/zip',
    });

    onProgress?.(100);

    return normalizeSingleFileResult(outputFile, {
        originalSize: file.size,
        outputSize: outputFile.size,
        extractedFiles: Number(response.headers.get('X-File-Count') || 0),
        note: 'Converted with server-side RAR extraction',
    });
}
