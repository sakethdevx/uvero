import { convertAudioOnline } from '../../../services/audioApi';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);

        itemProgress(10);
        const result = await convertAudioOnline(sourceFile, options);
        const outputFile = new File([result.blob], result.filename, { type: result.blob.type });

        itemProgress(100);
        outputFiles.push(outputFile);
        items.push({
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            duration: result.duration,
            format: (result.outputFormat || outputFile.type).replace('audio/', '').toUpperCase(),
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
