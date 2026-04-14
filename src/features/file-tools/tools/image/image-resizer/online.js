import { resizeImageOnline } from '../../../services/imageApi';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

const getExtension = (mimeType, fallbackName) => {
    const normalized = (mimeType || '').toLowerCase();
    if (normalized.includes('jpeg')) return '.jpg';
    if (normalized.includes('png')) return '.png';
    if (normalized.includes('webp')) return '.webp';
    const originalExtension = fallbackName.match(/\.[^/.]+$/)?.[0];
    return originalExtension || '.png';
};

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
        const sourceFile = sourceFiles[index];
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);

        itemProgress(10);
        const result = await resizeImageOnline(sourceFile, { width, height });
        const extension = getExtension(result.blob.type, sourceFile.name);
        const outputFile = new File(
            [result.blob],
            `${sourceFile.name.replace(/\.[^/.]+$/, '')}_${result.dimensions.converted.width}x${result.dimensions.converted.height}${extension}`,
            { type: result.blob.type }
        );

        itemProgress(100);
        outputFiles.push(outputFile);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            dimensions: result.dimensions,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
