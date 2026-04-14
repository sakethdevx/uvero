import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const angle = options.angle || 90;
    const pageSpec = options.pageSpec || 'all';
    const blob = await processor.rotate(file, angle, pageSpec, onProgress);
    const outputFile = new File([blob], `rotated_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        angle,
        pageSpec,
    });
}
