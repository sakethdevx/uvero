import { processor } from './processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const cropArea = options.cropArea;

    if (!cropArea) {
        throw new Error('Crop area is required.');
    }

    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await processor.cropImage(sourceFiles[index], cropArea, onProgress);
        const blob = await fetch(result.url).then((response) => response.blob());
        URL.revokeObjectURL(result.url);
        const outputFile = new File([blob], result.filename, { type: 'image/png' });

        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFiles[index].size,
            outputSize: result.size || outputFile.size,
            cropArea,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
