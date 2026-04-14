import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { IncomingForm } from 'formidable';
import * as unrar from 'node-unrar-js';
import sanitize from 'sanitize-filename';

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const config = {
    api: {
        bodyParser: false,
    },
};

const parseForm = async (req) => {
    const maxFileSize = Number(process.env.RAR_TO_ZIP_MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES);

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

export const sanitizeArchivePath = (inputPath) => {
    const normalized = inputPath
        .replace(/\\/g, '/')
        .split('/')
        .filter((segment) => segment && segment !== '.' && segment !== '..')
        .map((segment) => segment.replace(/[:*?"<>|]/g, '_'))
        .join('/');

    return normalized.replace(/^\/+/, '');
};

export const classifyExtractionError = (error) => {
    if (error?.code === 1009 || /maxFileSize|maxTotalFileSize/i.test(error?.message || '')) {
        return {
            status: 413,
            error: 'The uploaded RAR archive exceeds the maximum allowed size for this deployment.',
            code: 'FILE_TOO_LARGE',
        };
    }

    if (error?.reason === 'ERAR_MISSING_PASSWORD' || error?.reason === 'ERAR_BAD_PASSWORD') {
        return {
            status: 400,
            error: 'Password-protected RAR archives are not supported in this deployment.',
            code: 'PASSWORD_PROTECTED_ARCHIVE',
        };
    }

    if (error?.reason === 'ERAR_BAD_ARCHIVE' || error?.reason === 'ERAR_UNKNOWN_FORMAT') {
        return {
            status: 400,
            error: 'The uploaded file is not a valid RAR archive.',
            code: 'UNSUPPORTED_ARCHIVE',
        };
    }

    if (error?.reason === 'ERAR_BAD_DATA') {
        return {
            status: 400,
            error: 'The RAR archive appears to be damaged or incomplete.',
            code: 'DAMAGED_ARCHIVE',
        };
    }

    return {
        status: 500,
        error: error?.message || 'RAR to ZIP conversion failed.',
        code: 'RAR_TO_ZIP_FAILED',
    };
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

    let tempArchivePath = null;

    try {
        const { files, maxFileSize } = await parseForm(req);
        const archiveFile = files.archive?.[0] || files.archive;

        if (!archiveFile) {
            return res.status(400).json({ error: 'No RAR archive provided.', code: 'INVALID_FILE' });
        }

        tempArchivePath = archiveFile.filepath;

        if (!/\.rar$/i.test(archiveFile.originalFilename || archiveFile.newFilename || '')) {
            return res.status(400).json({ error: 'Please upload a valid RAR archive.', code: 'INVALID_FILE' });
        }

        const archiveBuffer = fs.readFileSync(tempArchivePath);
        const extractor = await unrar.createExtractorFromData({
            data: Uint8Array.from(archiveBuffer).buffer,
        });

        const list = extractor.getFileList();
        const arcHeader = list.arcHeader;
        const fileHeaders = [...list.fileHeaders];

        if (arcHeader?.flags?.volume) {
            return res.status(400).json({
                error: 'Multi-volume RAR archives are not supported yet.',
                code: 'MULTIPART_ARCHIVE_UNSUPPORTED',
            });
        }

        if (arcHeader?.flags?.headerEncrypted || fileHeaders.some((header) => header.flags?.encrypted)) {
            return res.status(400).json({
                error: 'Password-protected RAR archives are not supported in this deployment.',
                code: 'PASSWORD_PROTECTED_ARCHIVE',
            });
        }

        const extracted = extractor.extract();
        const filesWithContent = [...extracted.files];
        const zip = new JSZip();
        let fileCount = 0;

        for (const entry of filesWithContent) {
            const archivePath = sanitizeArchivePath(entry.fileHeader?.name || '');

            if (!archivePath) {
                continue;
            }

            if (entry.fileHeader?.flags?.directory) {
                zip.folder(archivePath);
                continue;
            }

            if (!entry.extraction) {
                continue;
            }

            zip.file(archivePath, Buffer.from(entry.extraction));
            fileCount += 1;
        }

        if (fileCount === 0) {
            return res.status(400).json({
                error: 'No extractable files were found in this RAR archive.',
                code: 'UNSUPPORTED_ARCHIVE',
            });
        }

        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });

        const originalBaseName = sanitize(path.basename(archiveFile.originalFilename || archiveFile.newFilename || 'archive', path.extname(archiveFile.originalFilename || archiveFile.newFilename || '')));
        const downloadName = `${originalBaseName || 'archive'}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('X-File-Count', String(fileCount));
        res.setHeader('X-Archive-Size', String(archiveBuffer.length));
        res.setHeader('X-Max-Upload-Bytes', String(maxFileSize));
        return res.status(200).send(zipBuffer);
    } catch (error) {
        const classified = classifyExtractionError(error);
        console.error('[convert-rar-to-zip] error:', error);
        return res.status(classified.status).json({
            error: classified.error,
            code: classified.code,
        });
    } finally {
        if (tempArchivePath && fs.existsSync(tempArchivePath)) {
            try {
                fs.unlinkSync(tempArchivePath);
            } catch {
                // Ignore cleanup errors.
            }
        }
    }
}
