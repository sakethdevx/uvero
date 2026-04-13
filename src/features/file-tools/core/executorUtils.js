import { createModeNotSupportedError, ModeNotSupportedError } from './errors';

export function assertModeSupported(executor, mode, toolId = executor?.toolId || 'unknown-tool') {
    if (!executor?.supportedModes?.includes(mode)) {
        throw createModeNotSupportedError(toolId, mode, executor?.supportedModes || []);
    }
}

export function normalizeSingleFileResult(primaryFile, meta = {}) {
    return {
        primaryFile,
        meta,
    };
}

export function normalizeMultiFileResult(files, meta = {}) {
    if (files.length === 1) {
        return normalizeSingleFileResult(files[0], meta);
    }

    return {
        files,
        meta,
    };
}

export function ensureFiles(files) {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error('At least one file is required.');
    }

    return files;
}

export function aggregateProgress(onProgress, index, totalFiles) {
    return (progress) => {
        if (!onProgress) return;
        const normalized = Math.round((index / totalFiles) * 100 + (progress / totalFiles));
        onProgress(Math.min(100, normalized));
    };
}

export function isModeNotSupportedError(error) {
    return error instanceof ModeNotSupportedError || error?.name === 'ModeNotSupportedError';
}
