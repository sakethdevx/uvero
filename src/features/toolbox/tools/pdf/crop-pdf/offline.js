import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const blob = await processor.crop(file, options, onProgress);
    const outputFile = new File([blob], `cropped_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        ...options,
    });
}
