import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const language = options.language || 'eng';
    const result = await processor.processOCR(file, language, onProgress);
    const outputFile = new File([result.blob], result.filename || `ocr_${file.name}`, {
        type: result.blob.type || 'application/pdf',
    });

    return normalizeSingleFileResult(outputFile, {
        extractedText: result.extractedText,
        totalPages: result.totalPages,
        language,
        outputSize: outputFile.size,
    });
}
