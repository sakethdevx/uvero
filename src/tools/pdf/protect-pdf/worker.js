/**
 * PDF Protection Worker
 * Handles PDF password protection using qpdf-wasm
 * Provides real PDF encryption with password protection
 */

import createQPDFModule from '@neslinesli93/qpdf-wasm';

let qpdfInstance = null;

// Initialize QPDF WASM
async function initQPDF() {
    if (!qpdfInstance) {
        qpdfInstance = await createQPDFModule({
            locateFile: () => new URL('@neslinesli93/qpdf-wasm/dist/qpdf.wasm', import.meta.url).href,
            noInitialRun: true,
        });
    }
    return qpdfInstance;
}

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, password, permissions } = e.data;

    if (type !== 'protect') {
        return;
    }

    try {
        // Initialize QPDF
        const qpdf = await initQPDF();

        // Convert ArrayBuffer to Uint8Array
        const pdfBytes = new Uint8Array(arrayBuffer);

        // Write input PDF to QPDF virtual filesystem
        const inputPath = '/input.pdf';
        const outputPath = '/output.pdf';
        qpdf.FS.writeFile(inputPath, pdfBytes);

        // Build encryption command
        // QPDF encryption: qpdf --encrypt user-password owner-password key-length [options] -- input.pdf output.pdf
        const args = [
            '--encrypt',
            password,           // User password (required to open)
            password,           // Owner password (required to modify - using same password)
            '256',              // AES 256-bit encryption
        ];

        // Add permission flags if specified
        if (permissions) {
            if (permissions.allowPrinting === false) {
                args.push('--print=none');
            }
            if (permissions.allowCopying === false) {
                args.push('--extract=n');
            }
        }

        // Complete the command
        args.push('--');
        args.push(inputPath);
        args.push(outputPath);

        // Execute QPDF encryption
        try {
            qpdf.callMain(args);
        } catch (qpdfError) {
            console.error('QPDF execution error:', qpdfError);
            throw new Error('Failed to encrypt PDF. Please check your password and try again.');
        }

        // Read the encrypted PDF
        const encryptedPdf = qpdf.FS.readFile(outputPath);

        // Clean up virtual filesystem
        try {
            qpdf.FS.unlink(inputPath);
            qpdf.FS.unlink(outputPath);
        } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError);
        }

        // Create blob from encrypted PDF
        const blob = new Blob([encryptedPdf], { type: 'application/pdf' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('PDF protection error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to protect PDF'
        });
    }
});
