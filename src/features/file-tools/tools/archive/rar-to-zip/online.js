import { ensureFiles } from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    ensureFiles(files);
    onProgress?.(10);
    throw new Error('RAR to ZIP is wired for online mode, but this deployment does not have a server-side RAR extraction service configured yet.');
}
