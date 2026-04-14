import { processor } from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function compressFile(file, options = {}, onProgress) {
    const result = await processor.compress(
        file,
        options.quality ?? 'medium',
        options.resolution ?? 'original',
        onProgress
    );

    const outputFile = new File([result.blob], result.filename, {
        type: result.blob.type || 'video/mp4',
    });

    return {
        file: outputFile,
        previewUrl: result.url,
        originalSize: file.size,
        outputSize: outputFile.size,
        reductionPercent: Math.max(0, Math.round(((file.size - outputFile.size) / file.size) * 100)),
    };
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFiles = [];
    const items = [];
    let previewUrl = null;

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const itemResult = await compressFile(
            sourceFiles[index],
            options,
            aggregateProgress(onProgress, index, sourceFiles.length)
        );

        outputFiles.push(itemResult.file);
        items.push({
            originalSize: itemResult.originalSize,
            outputSize: itemResult.outputSize,
            reductionPercent: itemResult.reductionPercent,
        });

        if (sourceFiles.length === 1) {
            previewUrl = itemResult.previewUrl;
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
