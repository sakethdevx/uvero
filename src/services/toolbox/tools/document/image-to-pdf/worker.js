import { executeImageToPdf } from './engine';

self.onmessage = async (e) => {
    const { id, images, options } = e.data;

    try {
        if (!images || images.length === 0) {
            throw new Error('No images provided to worker');
        }

        const pdfBytes = await executeImageToPdf(images, options);

        self.postMessage({
            id,
            status: 'success',
            result: pdfBytes,
        }, [pdfBytes.buffer]); // Transfer buffer for performance

    } catch (error) {
        self.postMessage({
            id,
            status: 'error',
            error: error.message
        });
    }
};
