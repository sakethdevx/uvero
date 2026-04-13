import { processor } from './processor';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

function fileNameToMimeType(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (extension === 'mp3') return 'audio/mpeg';
    if (extension === 'wav') return 'audio/wav';
    if (extension === 'ogg') return 'audio/ogg';

    return 'application/octet-stream';
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const format = options.format ?? 'mp3';
    const bitrate = options.bitrate ?? 192;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourceFile = sourceFiles[index];
        const conversion = await processor.convert(
            sourceFile,
            format,
            bitrate,
            aggregateProgress(onProgress, index, sourceFiles.length)
        );
        const blob = await fetch(conversion.url).then((response) => response.blob());
        URL.revokeObjectURL(conversion.url);
        const outputFile = new File([blob], conversion.filename, { type: fileNameToMimeType(conversion.filename) });

        outputFiles.push(outputFile);
        items.push({
            originalSize: sourceFile.size,
            outputSize: conversion.size || outputFile.size,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
