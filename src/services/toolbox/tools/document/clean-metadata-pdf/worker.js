import { processCleanMetadata } from './engine';

self.onmessage = async (e) => {
    const { files, options, id } = e.data;

    try {
        const onProgress = (percentage, message) => {
            self.postMessage({ type: 'progress', percentage, message, id });
        };

        const result = await processCleanMetadata(files, options, onProgress);
        self.postMessage({ type: 'success', ...result, id });
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message, id });
    }
};

self.onerror = (error) => {
    self.postMessage({ type: 'error', error: error.message || 'Unknown worker error', id: null });
    return true;
};
