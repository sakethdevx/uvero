import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const result = await processor.convert(sourceFiles, options, onProgress);
    const outputFile = new File([result.blob], result.filename, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        totalPages: result.totalPages,
        outputSize: outputFile.size,
    });
}
