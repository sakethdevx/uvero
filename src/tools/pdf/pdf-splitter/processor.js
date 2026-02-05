/**
 * PDF Splitter Processor
 * Manages Web Worker for PDF splitting
 */

let worker = null;

const initWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

/**
 * Get PDF page information
 * @param {File} file - The PDF file
 * @returns {Promise<Object>} - Page info with totalPages
 */
const getPageInfo = (file) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        const handleMessage = (e) => {
            const { type, data, error } = e.data;

            if (type === 'info-success') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                resolve(data);
            } else if (type === 'info-error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Failed to read PDF info'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'get-info',
                arrayBuffer: reader.result
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Split PDF
 * @param {File} file - The PDF file to split
 * @param {string} mode - Split mode ('all', 'pages', 'ranges')
 * @param {string} spec - Page specification (pages or ranges)
 * @param {number} totalPages - Total pages in PDF
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Split PDFs with files array
 */
const split = (file, mode, spec, totalPages, onProgress = () => { }) => {
    return new Promise((resolve, reject) => {
        const worker = initWorker();

        const handleMessage = (e) => {
            const { type, data, progress, error } = e.data;

            if (type === 'progress') {
                onProgress(progress);
            } else if (type === 'success') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);

                const originalName = file.name.replace(/\.pdf$/i, '');
                const files = data.pdfs.map((pdfData, index) => {
                    const url = URL.createObjectURL(pdfData.blob);
                    let filename;

                    if (mode === 'all') {
                        filename = `${originalName}_page_${pdfData.pageNumbers[0]}.pdf`;
                    } else if (mode === 'pages') {
                        filename = `${originalName}_extracted.pdf`;
                    } else {
                        const rangeStr = pdfData.pageNumbers.length === 1
                            ? `page_${pdfData.pageNumbers[0]}`
                            : `pages_${pdfData.pageNumbers[0]}-${pdfData.pageNumbers[pdfData.pageNumbers.length - 1]}`;
                        filename = `${originalName}_${rangeStr}.pdf`;
                    }

                    return {
                        url,
                        filename,
                        size: pdfData.blob.size,
                        pages: pdfData.pageNumbers.length
                    };
                });

                resolve({ files });
            } else if (type === 'error') {
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                reject(new Error(error || 'Split failed'));
            }
        };

        const handleError = (error) => {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error('Worker error: ' + error.message));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        const reader = new FileReader();
        reader.onload = () => {
            worker.postMessage({
                type: 'split',
                arrayBuffer: reader.result,
                mode,
                spec,
                totalPages
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

export const processor = {
    getPageInfo,
    split
};
