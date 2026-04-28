import { processor } from '../../pdf/pdf-converter/processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const sourceFile = sourceFiles[0];
    const pageRange = options.pageRange ?? 'all';
    const customPages = options.customPages ?? '';
    const images = await processor.convert(sourceFile, 'jpg', pageRange, customPages, onProgress);
    const baseName = sourceFile.name.replace(/\.pdf$/i, '');

    const outputFiles = await Promise.all(
        images.map(async (image, index) => {
            const blob = await fetch(image.url).then((response) => response.blob());
            URL.revokeObjectURL(image.url);
            const pageNumber = image.pageNumber || index + 1;
            return new File([blob], `${baseName}_page_${pageNumber}.jpg`, { type: 'image/jpeg' });
        })
    );

    const items = outputFiles.map((outputFile, index) => ({
        outputSize: outputFile.size,
        pageNumber: images[index]?.pageNumber || index + 1,
    }));

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, {
        items,
        pageCount: outputFiles.length,
    });
}
