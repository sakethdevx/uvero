import { processor } from './processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const width = options.width ?? null;
    const height = options.height ?? null;

    if (!width || !height) {
        throw new Error('Width and height are required for image resizing.');
    }

    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await processor.resize(sourceFiles[index], width, height, onProgress);
        const blob = await fetch(result.url).then((response) => response.blob());
        URL.revokeObjectURL(result.url);
        const outputFile = new File([blob], result.filename, { type: sourceFiles[index].type });

        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFiles[index].size,
            outputSize: result.size || outputFile.size,
            dimensions: {
                original: null,
                converted: {
                    width: result.width,
                    height: result.height,
                },
            },
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
