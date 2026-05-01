/**
 * Image WASM Converter Offline Runner
 * Executes conversion using Web Worker
 */

import processor from './processor';

export async function run({ files, options = {}, onProgress }) {
    const outputFormat = options.outputFormat || 'png';
    const quality = options.quality ?? 92;
    const keepMetadata = options.keepMetadata ?? true;

    const sourceFile = files[0];
    if (!sourceFile) {
        throw new Error('No file provided');
    }

    try {
        const result = await processor.convert(
            sourceFile,
            outputFormat,
            quality,
            keepMetadata,
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
