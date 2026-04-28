import { processor } from './processor';
import {
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function getPageInfo(file) {
    return processor.getPageInfo(file);
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;
    const {
        splitMode = 'all',
        spec = '',
        totalPages,
    } = options;

    if (!totalPages) {
        throw new Error('PDF page information is required before splitting.');
    }

    const result = await processor.split(file, splitMode, spec, totalPages, onProgress);
    const items = [];
    const outputFiles = [];

    for (const pdf of result.files) {
        const blob = await fetch(pdf.url).then((response) => response.blob());
        URL.revokeObjectURL(pdf.url);

        const outputFile = new File([blob], pdf.filename, { type: 'application/pdf' });
        outputFiles.push(outputFile);
        items.push({
            pages: pdf.pages,
            outputSize: pdf.size || outputFile.size,
        });
    }

    const meta = {
        items,
        splitMode,
        totalPages,
    };

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], {
            ...items[0],
            splitMode,
            totalPages,
        });
    }

    return normalizeMultiFileResult(outputFiles, meta);
}
