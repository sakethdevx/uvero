import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const result = await processor.convert(file, onProgress);
    const outputFile = new File([result.blob], file.name.replace(/\.pdf$/i, '.docx'), {
        type: result.blob.type || 'application/msword',
    });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        pageCount: result.pageCount,
    });
}
