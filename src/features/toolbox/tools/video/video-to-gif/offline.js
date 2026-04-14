import { processor } from '../../image/gif-maker/processor';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const result = await processor.createGIF(
        sourceFiles,
        'video',
        {
            frameDelay: options.frameDelay ?? 100,
            quality: options.quality ?? 10,
            width: options.width ?? 480,
            loop: options.loop ?? 0,
        },
        onProgress
    );

    const outputFile = new File([result.blob], result.filename, {
        type: result.blob.type || 'image/gif',
    });

    return {
        ...normalizeSingleFileResult(outputFile, {
            outputSize: outputFile.size,
            frameDelay: options.frameDelay ?? 100,
            quality: options.quality ?? 10,
            width: options.width ?? 480,
        }),
        previewUrl: result.url,
    };
}
