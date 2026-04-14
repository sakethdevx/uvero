import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const { password } = options;

    if (!password) {
        throw new Error('Password is required.');
    }

    const blob = await processor.unlock(file, password, onProgress);
    const outputFile = new File([blob], `unlocked_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
    });
}
