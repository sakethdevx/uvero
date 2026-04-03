/**
 * PDF Compare Worker (placeholder)
 * Comparison is handled via pdfjs-dist in processor.js
 */

self.addEventListener('message', async (e) => {
    const { type } = e.data;
    if (type === 'ping') {
        self.postMessage({ type: 'pong' });
    }
});
