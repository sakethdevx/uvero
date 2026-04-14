import processor from './processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFormat = options.outputFormat ?? options.format ?? 'png';
    const width = options.width ?? null;
    const height = options.height ?? null;
    const maintainAspectRatio = options.maintainAspectRatio ?? true;
    const quality = options.quality ?? null;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await processor.convert(
            sourceFiles[index],
            outputFormat,
            width,
            height,
            maintainAspectRatio,
            quality,
            onProgress
        );
        outputFiles.push(result.file);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.convertedSize,
            format: result.format,
            dimensions: result.dimensions,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}

export function cleanup() {
    processor.terminate();
}
