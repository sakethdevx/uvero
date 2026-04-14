import { compressAudioOnline } from '../../../services/audioApi';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const bitrate = options.bitrate ?? 128;
    const result = await compressAudioOnline(file, { bitrate }, onProgress);
    const outputFile = new File([result.blob], result.filename, { type: result.blob.type });

    const savings = result.originalSize > 0
        ? Number((((result.originalSize - result.outputSize) / result.originalSize) * 100).toFixed(1))
        : 0;

    return {
        ...normalizeSingleFileResult(outputFile, {
            originalSize: result.originalSize,
            outputSize: result.outputSize,
            compressedSize: result.outputSize,
            savings,
            bitrate,
            duration: result.duration,
        }),
        previewUrl: URL.createObjectURL(outputFile),
    };
}
