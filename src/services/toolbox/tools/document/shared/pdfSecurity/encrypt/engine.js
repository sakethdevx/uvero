import { getSecuredFileName } from '../pdfSecurityUtils';

// QPDF instance initialization using dynamic import
let qpdfPromise = null;

async function initializeQpdf() {
    if (qpdfPromise) return qpdfPromise;

    qpdfPromise = new Promise(async (resolve, reject) => {
        try {
            // Import the ES module version of qpdf.js we created
            const qpdfUrl = self.location.origin + '/workers/qpdf.js';
            const module = await import(/* @vite-ignore */ qpdfUrl);
            const createModule = module.default;

            createModule({
                locateFile: (path) => {
                    if (path.endsWith('.wasm')) return '/workers/qpdf.wasm';
                    return path;
                }
            }).then((instance) => {
                resolve(instance);
            }).catch(err => {
                qpdfPromise = null;
                reject(err);
            });
        } catch (err) {
            qpdfPromise = null;
            reject(err);
        }
    });

    return qpdfPromise;
}

export const processEncrypt = async (files, options = {}, onProgress) => {
    const {
        ownerPassword = '',
        userPassword = '',
        permissions = 0,
    } = options;

    if (files.length === 0) throw new Error('No PDF files provided for encryption.');
    if (files.length > 1) throw new Error('Please select only one PDF file for encryption.');

    const file = files[0];

    if (onProgress) onProgress(5, 'Initializing encryption engine...');
    const qpdf = await initializeQpdf();

    if (onProgress) onProgress(15, 'Reading PDF file...');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const inputPath = '/input.pdf';
    const outputPath = '/output.pdf';

    try {
        qpdf.FS.writeFile(inputPath, uint8Array);
    } catch (e) {
        throw new Error('Failed to write input file to WebAssembly filesystem.');
    }

    if (onProgress) onProgress(40, 'Encrypting PDF with 256-bit AES...');

    const userPass = userPassword || '';
    const ownerPass = ownerPassword || userPass;
    const hasOwnerPass = !!ownerPassword && ownerPassword !== userPassword;

    // Base args: [input, --encrypt, userpw, ownerpw, 256, [permissions], --, output]
    const args = [inputPath, '--encrypt', userPass, ownerPass, '256'];

    // Map Uvero PERMISSION_FLAGS to qpdf args
    const PERMISSION_FLAGS = {
        PRINT: 0x04,
        MODIFY_CONTENTS: 0x08,
        COPY: 0x10,
        MODIFY_ANNOTATIONS: 0x20,
        FILL_FORM: 0x100,
        COPY_FOR_ACCESSIBILITY: 0x200,
        ASSEMBLE_DOCUMENT: 0x400,
        HIGH_QUALITY_PRINT: 0x800,
    };

    if (hasOwnerPass) {
        // By default qpdf allows everything. We use --modify=none etc. to restrict.
        const canPrint = (permissions & PERMISSION_FLAGS.PRINT) !== 0;
        const canCopy = (permissions & PERMISSION_FLAGS.COPY) !== 0;
        const canModify = (permissions & PERMISSION_FLAGS.MODIFY_CONTENTS) !== 0;

        if (!canPrint) args.push('--print=none');
        if (!canCopy) {
            args.push('--extract=n');
            args.push('--accessibility=n');
        }
        if (!canModify) {
            args.push('--modify=none');
            args.push('--annotate=n');
            args.push('--form=n');
            args.push('--assemble=n');
        }
    }

    args.push('--', outputPath);

    try {
        qpdf.callMain(args);
    } catch (qpdfError) {
        // Cleanup after error
        try { qpdf.FS.unlink(inputPath); } catch (e) { }
        throw new Error('Encryption failed. The file may already be encrypted.');
    }

    if (onProgress) onProgress(80, 'Preparing encrypted file...');

    let outputFile;
    try {
        outputFile = qpdf.FS.readFile(outputPath, { encoding: 'binary' });
    } catch (e) {
        // Cleanup
        try { qpdf.FS.unlink(inputPath); } catch (e) { }
        throw new Error('Failed to read output file from WebAssembly filesystem.');
    }

    if (!outputFile || outputFile.length === 0) {
        throw new Error('Encryption resulted in an empty file.');
    }

    const blob = new Blob([outputFile], { type: 'application/pdf' });

    // Cleanup WASM filesystem
    try { qpdf.FS.unlink(inputPath); } catch (e) { }
    try { qpdf.FS.unlink(outputPath); } catch (e) { }

    if (onProgress) onProgress(100, 'Encryption complete!');

    const outputFilename = getSecuredFileName(file.name, 'encrypt');
    return {
        blob,
        filename: outputFilename,
        metadata: {
            hasOwnerPassword: !!ownerPassword,
            hasUserPassword: !!userPassword,
            permissions,
            encryptionAlgorithm: 'AES_256'
        }
    };
};
