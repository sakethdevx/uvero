/**
 * Pandoc WASM Offline Runner
 * Executes document conversion using Web Worker
 */

import processor from './processor';

export async function run({ files, options = {}, onProgress }) {
    const sourceFile = files[0];
    if (!sourceFile) {
        throw new Error('No file provided');
    }

    const outputFormat = options.outputFormat || options.format || 'pdf';

    try {
        const result = await processor.convert(
            sourceFile,
            outputFormat,
            onProgress
        );

        return {
            primaryFile: result.file,
            items: [result]
        };
    } catch (error) {
        processor.terminate();
        throw error;
    }
}

export function cleanup() {
    processor.terminate();
}
