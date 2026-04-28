import { processor } from './processor';
import { ensureFiles, normalizeSingleFileResult } from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const pageSize = options.pageSize ?? 'fit';
    const pdfBlob = await processor.convert(sourceFiles, pageSize, onProgress);
    const outputFile = new File([pdfBlob], 'images.pdf', { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: pdfBlob.size,
        pageCount: sourceFiles.length,
        note: `${sourceFiles.length} ${sourceFiles.length === 1 ? 'image' : 'images'} combined`,
    });
}
