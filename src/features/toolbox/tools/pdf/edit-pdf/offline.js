import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function getPageInfo(file) {
    return processor.getPageInfo(file);
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const { annotations = [] } = options;

    if (!annotations.length) {
        throw new Error('At least one annotation is required.');
    }

    const blob = await processor.edit(file, annotations, onProgress);
    const outputFile = new File([blob], `edited_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        annotationCount: annotations.length,
    });
}
