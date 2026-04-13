import {
    aggregateProgress,
    assertModeSupported,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';
import { run as runOffline, convertFile as convertFileOffline } from './offline';
import { run as runOnline, convertFile as convertFileOnline } from './online';

const toolId = 'heic-to-jpg';
const supportedModes = ['offline', 'online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(heicToJpgExecutor, mode, toolId);

    if (mode === 'offline') {
        return runOffline(input);
    }

    const sourceFiles = ensureFiles(input.files);
    const { options = {}, onProgress } = input;
    const quality = options.quality ?? 0.92;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);

        try {
            itemProgress(10);
            const outputFile = await convertFileOffline(sourceFile, quality);
            itemProgress(100);
            outputFiles.push(outputFile);
            items.push({
                originalSize: sourceFile.size,
                outputSize: outputFile.size,
                note: 'Converted client-side',
            });
        } catch (_error) {
            itemProgress(20);
            const outputFile = await convertFileOnline(sourceFile, quality);
            itemProgress(100);
            outputFiles.push(outputFile);
            items.push({
                originalSize: sourceFile.size,
                outputSize: outputFile.size,
                note: 'Converted with server rescue',
            });
        }
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}

const heicToJpgExecutor = {
    toolId,
    supportedModes,
    run,
    runOnline,
};

export default heicToJpgExecutor;
