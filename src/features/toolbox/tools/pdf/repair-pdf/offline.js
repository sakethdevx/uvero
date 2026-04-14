import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const repairResult = await processor.repair(file, onProgress);
    const outputFile = new File([repairResult.blob], `repaired_${file.name}`, { type: 'application/pdf' });

    return normalizeSingleFileResult(outputFile, {
        pagesRecovered: repairResult.pagesRecovered,
        originalSize: repairResult.originalSize,
        repairedSize: repairResult.repairedSize,
        outputSize: outputFile.size,
    });
}
