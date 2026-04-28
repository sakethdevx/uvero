import { convertImageOnline } from '../../../services/imageApi';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

const getExtension = (formatOrMime) => {
    const normalized = (formatOrMime || '').toLowerCase();

    if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg';
    if (normalized.includes('png')) return '.png';
    if (normalized.includes('webp')) return '.webp';

    return '.png';
};

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);

        itemProgress(10);
        const result = await convertImageOnline(sourceFile, options);
        const extension = getExtension(result.outputFormat || result.blob.type);
        const outputFile = new File(
            [result.blob],
            `${sourceFile.name.replace(/\.[^/.]+$/, '')}_converted${extension}`,
            { type: result.blob.type }
        );

        itemProgress(100);
        outputFiles.push(outputFile);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            format: (result.outputFormat || outputFile.type).replace('image/', '').toUpperCase(),
            dimensions: result.dimensions,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
