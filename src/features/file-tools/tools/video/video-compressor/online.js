import { compressVideoOnline } from '../../../services/videoApi';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFiles = [];
    const items = [];
    let previewUrl = null;

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const result = await compressVideoOnline(
            sourceFile,
            {
                quality: options.quality ?? 'medium',
                resolution: options.resolution ?? 'original',
            },
            aggregateProgress(onProgress, index, sourceFiles.length)
        );
        const outputFile = new File([result.blob], result.filename, { type: result.blob.type });
        const reductionPercent = result.originalSize > 0
            ? Math.max(0, Math.round(((result.originalSize - result.outputSize) / result.originalSize) * 100))
            : 0;

        outputFiles.push(outputFile);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            reductionPercent,
            duration: result.duration,
        });

        if (sourceFiles.length === 1) {
            previewUrl = URL.createObjectURL(outputFile);
        }
    }

    if (outputFiles.length === 1) {
        return {
            ...normalizeSingleFileResult(outputFiles[0], items[0]),
            previewUrl,
        };
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
