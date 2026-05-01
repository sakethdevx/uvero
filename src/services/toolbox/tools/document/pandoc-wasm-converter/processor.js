/**
 * Pandoc WASM Processor
 * Follows VERT reference implementation
 */

import workerUrl from './worker.js?worker&url';

class PandocWasmProcessor {
    constructor() {
        this.wasm = null;
        this.wasmLoading = null;
    }

    async ensureWasmLoaded() {
        if (this.wasm) return;
        if (!this.wasmLoading) {
            this.wasmLoading = (async () => {
                const response = await fetch('/pandoc.wasm');
                if (!response.ok) {
                    throw new Error(`Failed to fetch Pandoc WASM: ${response.status} ${response.statusText}`);
                }
                this.wasm = await response.arrayBuffer();
            })();
        }
        await this.wasmLoading;
    }

    getExtension(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ext ? `.${ext}` : '';
    }

    async convert(file, outputFormat, onProgress) {
        await this.ensureWasmLoaded();
        const outputExt = outputFormat.toLowerCase();
        const fromExt = this.getExtension(file.name);

        return new Promise((resolve, reject) => {
            const worker = new Worker(workerUrl, { type: 'module' });

            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Conversion timeout after 30s'));
            }, 30000);

            const handleMessage = (e) => {
                const { type, output, error, isZip, errorKind, id } = e.data;

                if (type === 'loaded') {
                    // Send conversion request after WASM loaded
                    worker.postMessage({
                        type: 'convert',
                        to: outputExt,
                        input: {
                            file,
                            name: file.name,
                            from: fromExt,
                            to: outputExt,
                        },
                        id: file.name,
                    });
                } else if (type === 'finished') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    worker.terminate();

                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const ext = isZip ? 'zip' : (outputExt === '.jpg' ? 'jpg' : outputExt.slice(1));
                    const newFileName = `${baseName}.${ext}`;
                    const blob = new Blob([output], { type: isZip ? 'application/zip' : `image/${ext}` });
                    const convertedFile = new File([blob], newFileName, { type: blob.type });

                    resolve({
                        file: convertedFile,
                        blob,
                        originalSize: file.size,
                        convertedSize: blob.size,
                        format: outputExt.toUpperCase(),
                    });
                } else if (type === 'error') {
                    clearTimeout(timeout);
                    worker.removeEventListener('message', handleMessage);
                    worker.removeEventListener('error', handleError);
                    worker.terminate();

                    let errMsg = error || 'Conversion failed';
                    if (errorKind) {
                        switch (errorKind) {
                case 'PandocUnknownReaderError':
                    errMsg = `${file.from} is not a supported input format for documents.`;
                    break;
                case 'PandocUnknownWriterError':
                    const displayExt = outputExt.startsWith('.') ? outputExt.slice(1) : outputExt;
                    errMsg = `${displayExt} is not a supported output format for documents.`;
                    break;
                case 'PandocParseError':
                    if (errMsg.includes('JSON missing pandoc-api-version')) {
                        errMsg = 'This JSON file is not a pandoc-converted JSON file. It must be converted with pandoc / VERT to be converted again.';
                    }
                    break;
                            case 'PandocUnknownWriterError':
                                errMsg = `${outputExt} is not a supported output format for documents.`;
                                break;
                            case 'PandocParseError':
                                if (errMsg.includes('JSON missing pandoc-api-version')) {
                                    errMsg = 'This JSON file is not a pandoc-converted JSON file. It must be converted with pandoc / VERT to be converted again.';
                                }
                                break;
                        }
                    }
                    reject(new Error(errMsg));
                }
            };

            const handleError = (err) => {
                clearTimeout(timeout);
                worker.terminate();
                reject(err);
            };

            worker.addEventListener('message', handleMessage);
            worker.addEventListener('error', handleError);

            // Send load message
            worker.postMessage({
                type: 'load',
                wasm: this.wasm,
                id: file.name,
            });
        });
    }

    terminate() {
        // Nothing to clean up
    }
}

const processor = new PandocWasmProcessor();

export default {
    convert: (...args) => processor.convert(...args),
    terminate: () => {},
};