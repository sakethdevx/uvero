import { processor } from './processor';
import { ensureFiles } from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);

    if (sourceFiles.length < 2) {
        throw new Error('Two PDF files are required.');
    }

    const [file1, file2] = sourceFiles;
    const comparisonResult = await processor.compare(file1, file2, onProgress);

    return {
        meta: comparisonResult,
    };
}
