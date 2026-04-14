import heic2any from 'heic2any';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function convertFile(file, quality) {
    const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality,
    });

    const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const quality = options.quality ?? 0.92;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const itemProgress = aggregateProgress(onProgress, index, sourceFiles.length);
        itemProgress(10);
        const outputFile = await convertFile(sourceFiles[index], quality);
        itemProgress(100);
        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFiles[index].size,
            outputSize: outputFile.size,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
