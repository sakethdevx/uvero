import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);

    if (sourceFiles.length < 2) {
        throw new Error('Please add at least 2 PDF files to merge.');
    }

    const result = await processor.merge(sourceFiles, onProgress);
    const blob = await fetch(result.url).then((response) => response.blob());
    URL.revokeObjectURL(result.url);

    const outputFile = new File([blob], result.filename, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: result.size || outputFile.size,
        totalPages: result.totalPages,
        sourceCount: sourceFiles.length,
    });
}
