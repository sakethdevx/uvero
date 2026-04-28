import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const sourceLang = options.sourceLang || 'en';
    const targetLang = options.targetLang || 'es';
    const result = await processor.translate(file, sourceLang, targetLang, onProgress);
    const outputFile = new File([result.blob], result.filename || `translated_${targetLang}_${file.name}`, {
        type: result.blob.type || 'application/pdf',
    });

    return normalizeSingleFileResult(outputFile, {
        extractedText: result.extractedText,
        totalPages: result.totalPages,
        sourceLang,
        targetLang,
        outputSize: outputFile.size,
    });
}
