import { compressImageOnline } from '../../../services/imageApi';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

const getExtension = (mimeType) => {
    const extensions = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
    };

    return extensions[mimeType] || '.jpg';
};

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const quality = options.quality ?? 80;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);
        itemProgress(10);

        const result = await compressImageOnline(sourceFile, quality);
        const outputFile = new File(
            [result.blob],
            sourceFile.name.replace(/\.[^/.]+$/, '') + `_compressed${getExtension(result.blob.type)}`,
            { type: result.blob.type }
        );

        itemProgress(100);
        outputFiles.push(outputFile);
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
