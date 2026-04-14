import { processor } from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function convertFile(file, options = {}, onProgress) {
    const outputFormat = options.outputFormat ?? 'mp4';
    const quality = options.quality ?? 'high';
    const result = await processor.convert(file, outputFormat, quality, onProgress);

    const mimeType = result.blob.type || `video/${outputFormat}`;
    const outputFile = new File([result.blob], result.filename, { type: mimeType });

    return {
        file: outputFile,
        previewUrl: result.url,
        originalSize: file.size,
        outputSize: outputFile.size,
        outputFormat,
        quality,
    };
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFiles = [];
    const items = [];
    let previewUrl = null;

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const itemResult = await convertFile(
            sourceFiles[index],
            options,
            aggregateProgress(onProgress, index, sourceFiles.length)
        );

        outputFiles.push(itemResult.file);
        items.push({
            originalSize: itemResult.originalSize,
            outputSize: itemResult.outputSize,
            outputFormat: itemResult.outputFormat,
            quality: itemResult.quality,
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
