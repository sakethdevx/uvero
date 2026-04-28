import { processor } from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const quality = options.quality ?? 'medium';
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await processor.removeBackground(
            sourceFiles[index],
            quality,
            aggregateProgress(onProgress, index, sourceFiles.length)
        );
        const blob = result.blob;
        URL.revokeObjectURL(result.url);
        const outputFile = new File([blob], result.filename, { type: 'image/png' });

        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFiles[index].size,
            outputSize: result.size || outputFile.size,
            dimensions: {
                converted: {
                    width: result.width,
                    height: result.height,
                },
            },
            note: 'Transparent PNG output',
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
