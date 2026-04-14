import { cropImageOnline } from '../../../services/imageApi';
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
        const sourceFile = sourceFiles[index];
        onProgress?.(10);

        const result = await cropImageOnline(sourceFile, cropArea);
        const outputFile = new File(
            [result.blob],
            `${sourceFile.name.replace(/\.[^/.]+$/, '')}_cropped.png`,
            { type: 'image/png' }
        );

        onProgress?.(100);
        outputFiles.push(outputFile);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            cropArea,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
