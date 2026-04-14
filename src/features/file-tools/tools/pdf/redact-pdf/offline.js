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
    const { redactions = [] } = options;

    if (!redactions.length) {
        throw new Error('At least one redaction is required.');
    }

    const blob = await processor.redact(file, redactions, onProgress);
    const outputFile = new File([blob], `redacted_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        redactionCount: redactions.length,
    });
}
