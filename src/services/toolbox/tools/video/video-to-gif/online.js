import { convertVideoToGifOnline } from '../../../services/videoApi';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const result = await convertVideoToGifOnline(
        file,
        {
            frameDelay: options.frameDelay ?? 100,
            quality: options.quality ?? 10,
            width: options.width ?? 480,
            loop: options.loop ?? 0,
        },
        onProgress
    );
    const outputFile = new File([result.blob], result.filename, { type: result.blob.type });

    return {
        ...normalizeSingleFileResult(outputFile, {
            outputSize: result.outputSize,
            frameDelay: options.frameDelay ?? 100,
            quality: options.quality ?? 10,
            width: options.width ?? 480,
            duration: result.duration,
        }),
        previewUrl: URL.createObjectURL(outputFile),
    };
}
