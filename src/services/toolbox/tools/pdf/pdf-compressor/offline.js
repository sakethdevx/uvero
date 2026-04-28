import { processor } from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const compressionLevel = options.compressionLevel ?? options.level ?? 'balanced';
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const compressedBlob = await processor.compress(
            sourceFile,
            compressionLevel,
            aggregateProgress(onProgress, index, sourceFiles.length)
        );
        const outputFile = new File([compressedBlob], sourceFile.name, { type: 'application/pdf' });
        const savings = Number((((sourceFile.size - compressedBlob.size) / sourceFile.size) * 100).toFixed(1));

        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFile.size,
            outputSize: compressedBlob.size,
            reductionPercent: savings,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
