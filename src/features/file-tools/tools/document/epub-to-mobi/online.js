import { ensureFiles } from '../../../core/executorUtils';
import { createServiceUnavailableError } from '../../../core/errors';

export async function run({ files, onProgress }) {
    ensureFiles(files);
    onProgress?.(10);
    throw createServiceUnavailableError(
        'epub-to-mobi',
        'EPUB to MOBI is available only in online mode, but this deployment does not have a MOBI conversion backend configured yet.'
    );
}
