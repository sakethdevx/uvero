import { processor } from './processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const {
        format = 'png',
        pageRange = 'all',
        customPages = '',
    } = options;

    const images = await processor.convert(file, format, pageRange, customPages, onProgress);
    const outputFiles = [];
    const items = [];

    for (const image of images) {
        const blob = await fetch(image.url).then((response) => response.blob());
        URL.revokeObjectURL(image.url);

        const outputFile = new File([blob], `page_${image.pageNumber}.${format}`, {
            type: format === 'jpg' ? 'image/jpeg' : 'image/png',
        });

        outputFiles.push(outputFile);
        items.push({
            pageNumber: image.pageNumber,
            outputSize: image.size || outputFile.size,
        });
    }

    const meta = {
        format,
        count: outputFiles.length,
        items,
    };

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], {
            ...items[0],
            format,
            count: 1,
        });
    }

    return normalizeMultiFileResult(outputFiles, meta);
}
