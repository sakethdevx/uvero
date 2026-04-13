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
    const { signatureDataUrl, placement } = options;

    if (!signatureDataUrl) {
        throw new Error('Signature data is required.');
    }

    const blob = await processor.sign(file, signatureDataUrl, placement, onProgress);
    const outputFile = new File([blob], `signed_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        page: placement?.page,
    });
}
