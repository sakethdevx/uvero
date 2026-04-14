import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function convertFile(file, bitrate, onProgress) {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('bitrate', bitrate.toString());

    if (onProgress) onProgress(20);
    const response = await fetch('/api/convert-video-to-mp3', {
        method: 'POST',
        body: formData,
    });

    if (onProgress) onProgress(80);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server conversion failed');
    }

    const blob = await response.blob();
    const outputFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.mp3`, { type: 'audio/mpeg' });

    if (onProgress) onProgress(100);

    return {
        file: outputFile,
        size: parseInt(response.headers.get('X-Audio-Size') || blob.size, 10),
        duration: response.headers.get('X-Duration') || 'N/A',
    };
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const bitrate = options.bitrate ?? 192;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await convertFile(sourceFiles[index], bitrate, aggregateProgress(onProgress, index, sourceFiles.length));
        outputFiles.push(result.file);
        items.push({
            outputSize: result.size,
            duration: result.duration,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
