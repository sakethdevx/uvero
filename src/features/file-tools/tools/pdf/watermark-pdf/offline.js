import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const blob = await processor.addWatermark(file, options, onProgress);
    const outputFile = new File([blob], `watermarked_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        type: options.type,
        position: options.position,
        opacity: options.opacity,
    });
}
