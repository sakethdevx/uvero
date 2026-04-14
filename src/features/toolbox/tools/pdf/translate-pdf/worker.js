// Translation processing is handled in the main thread via processor.js
// using pdfjs-dist for text extraction
self.addEventListener('message', async (e) => {
    const { type } = e.data;
    if (type === 'ping') {
        self.postMessage({ type: 'pong' });
    }
});
