import processor from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const converted = await processor.convert(file, onProgress);
    const outputFile = new File([converted.blob], converted.file.name, {
        type: converted.file.type || 'application/pdf',
    });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
    });
}
