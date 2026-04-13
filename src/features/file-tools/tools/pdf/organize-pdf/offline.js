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
    const { pageOrder = [] } = options;

    if (!pageOrder.length) {
        throw new Error('Page order is required.');
    }

    const blob = await processor.organize(file, pageOrder, onProgress);
    const outputFile = new File([blob], `organized_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        pageCount: pageOrder.length,
    });
}
