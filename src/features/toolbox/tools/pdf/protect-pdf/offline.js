import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const { password, allowPrinting = true, allowCopying = false } = options;

    if (!password) {
        throw new Error('Password is required.');
    }

    const blob = await processor.protect(
        file,
        password,
        { allowPrinting, allowCopying },
        onProgress,
    );
    const outputFile = new File([blob], `protected_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        allowPrinting,
        allowCopying,
    });
}
