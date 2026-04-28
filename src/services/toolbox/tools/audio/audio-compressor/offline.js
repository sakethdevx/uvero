import { processor } from './processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const bitrate = options.bitrate ?? 128;
    const compressedBlob = await processor.compress(file, bitrate, onProgress);
    const outputFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.mp3'), {
        type: 'audio/mpeg',
    });

    const originalSize = file.size;
    const compressedSize = compressedBlob.size;
    const savings = originalSize > 0
        ? Number((((originalSize - compressedSize) / originalSize) * 100).toFixed(1))
        : 0;

    return {
        ...normalizeSingleFileResult(outputFile, {
            originalSize,
            compressedSize,
            savings,
            bitrate,
        }),
        previewUrl: URL.createObjectURL(compressedBlob),
    };
}
