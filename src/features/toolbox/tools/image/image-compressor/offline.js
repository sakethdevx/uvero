import processor from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const quality = options.quality ?? 80;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const result = await processor.compress(sourceFile, quality, aggregateProgress(onProgress, index, sourceFiles.length));
        outputFiles.push(result.file);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.compressedSize,
            reductionPercent: result.reduction,
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
