import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { IncomingForm } from 'formidable';
import sanitize from 'sanitize-filename';

const execFileAsync = promisify(execFile);
const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

export const config = {
    api: {
        bodyParser: false,
    },
};

const parseForm = async (req) => {
    const maxFileSize = Number(process.env.EPUB_TO_MOBI_MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES);

    return new Promise((resolve, reject) => {
        const form = new IncomingForm({
            maxFileSize,
            keepExtensions: true,
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
                return;
            }

            resolve({ fields, files, maxFileSize });
        });
    });
};

const createHttpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const createCodedHttpError = (status, code, message, details) => {
    const error = createHttpError(status, message);
    error.code = code;
    error.details = details;
    return error;
};

const isEpubUpload = (file) => {
    const lowerName = (file?.originalFilename || file?.newFilename || '').toLowerCase();
    return file?.mimetype === 'application/epub+zip' || lowerName.endsWith('.epub');
};

const getConverterRunConfig = (binaryPath, inputPath, outputPath, workdir) => {
    const binaryName = path.basename(binaryPath).toLowerCase();

    if (binaryName.includes('ebook-convert')) {
        return {
            args: [inputPath, outputPath],
            cwd: workdir,
        };
    }

    return {
        args: [inputPath, '-o', path.basename(outputPath)],
        cwd: workdir,
    };
};

const cleanupFile = (filePath) => {
    if (!filePath || !fs.existsSync(filePath)) {
        return;
    }

    try {
        fs.unlinkSync(filePath);
    } catch {
        // Ignore cleanup errors.
    }
};

const cleanupDirectory = (dirPath) => {
    if (!dirPath || !fs.existsSync(dirPath)) {
        return;
    }

    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
    } catch {
        // Ignore cleanup errors.
    }
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
    }

    let tempInputPath = null;
    let workdir = null;

    try {
        const binaryPath = process.env.EPUB_TO_MOBI_BINARY_PATH;
        if (!binaryPath) {
            throw createCodedHttpError(
                503,
                'RUNTIME_NOT_CONFIGURED',
                'EPUB to MOBI conversion is available only when this deployment is configured with a server-side converter runtime.'
            );
        }

        const { files, maxFileSize } = await parseForm(req);
        const ebookFile = files.ebook?.[0] || files.ebook;

        if (!ebookFile) {
            throw createCodedHttpError(400, 'INVALID_FILE', 'No EPUB file provided.');
        }

        if (!isEpubUpload(ebookFile)) {
            throw createCodedHttpError(400, 'INVALID_FILE', 'Please upload a valid EPUB file.');
        }

        if (!fs.existsSync(binaryPath)) {
            throw createCodedHttpError(
                503,
                'RUNTIME_NOT_FOUND',
                'The configured EPUB to MOBI converter runtime was not found on this deployment.'
            );
        }

        tempInputPath = ebookFile.filepath;
        workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'epub-to-mobi-'));

        const safeBaseName = sanitize(
            path.basename(
                ebookFile.originalFilename || ebookFile.newFilename || 'ebook',
                path.extname(ebookFile.originalFilename || ebookFile.newFilename || '')
            )
        ) || 'ebook';

        const inputPath = path.join(workdir, `${safeBaseName}.epub`);
        const outputPath = path.join(workdir, `${safeBaseName}.mobi`);

        fs.copyFileSync(tempInputPath, inputPath);

        const { args, cwd } = getConverterRunConfig(binaryPath, inputPath, outputPath, workdir);

        await execFileAsync(binaryPath, args, {
            cwd,
            timeout: DEFAULT_TIMEOUT_MS,
            maxBuffer: 10 * 1024 * 1024,
        });

        if (!fs.existsSync(outputPath)) {
            throw createCodedHttpError(
                503,
                'CONVERSION_FAILED',
                'The EPUB to MOBI converter did not produce an output file. Check the configured runtime on this deployment.'
            );
        }

        const outputBuffer = fs.readFileSync(outputPath);

        res.setHeader('Content-Type', 'application/x-mobipocket-ebook');
        res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}.mobi"`);
        res.setHeader('X-Original-Size', String(ebookFile.size || 0));
        res.setHeader('X-Converted-Size', String(outputBuffer.length));
        res.setHeader('X-Max-Upload-Bytes', String(maxFileSize));
        res.setHeader('X-Converter-Binary', path.basename(binaryPath));

        return res.status(200).send(outputBuffer);
    } catch (error) {
        const status = error?.status
            || (error?.code === 1009 || /maxFileSize|maxTotalFileSize/i.test(error?.message || '') ? 413 : 500);
        const message = status === 413
            ? 'The uploaded EPUB exceeds the maximum allowed size for this deployment.'
            : error?.message || 'EPUB to MOBI conversion failed.';
        const code = status === 413
            ? 'FILE_TOO_LARGE'
            : error?.code || 'EPUB_TO_MOBI_FAILED';

        console.error('[convert-epub-to-mobi] error:', error);
        return res.status(status).json({
            error: message,
            code,
            details: error?.details,
        });
    } finally {
        cleanupFile(tempInputPath);
        cleanupDirectory(workdir);
    }
}
