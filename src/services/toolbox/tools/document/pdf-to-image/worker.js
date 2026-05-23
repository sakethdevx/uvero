import { processPdfToImage } from './engine';

self.onmessage = async (event) => {
    const { files, options, id } = event.data;

    try {
        const onProgress = (percentage, message) => {
            self.postMessage({ type: 'progress', percentage, message, id });
        };

        const result = await processPdfToImage(files, options, onProgress);
        self.postMessage({ type: 'success', ...result, id });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message || 'PDF to Image export failed.',
            id,
        });
    }
};

self.onerror = (error) => {
    self.postMessage({
        type: 'error',
        error: error.message || 'Unknown worker error',
        id: null,
    });
    return true;
};
