import { IncomingForm } from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const config = {
    api: {
        bodyParser: false,
    },
};

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const VIDEO_UPLOAD_FIELD = 'video';

const MIME_BY_FORMAT = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    gif: 'image/gif',
};

const QUALITY_PRESETS = {
    low: { videoBitrate: '1M', audioBitrate: '96k', crf: '32' },
    medium: { videoBitrate: '2M', audioBitrate: '128k', crf: '27' },
    high: { videoBitrate: '4M', audioBitrate: '192k', crf: '22' },
};

const RESOLUTION_PRESETS = {
    original: null,
    '480p': '854:-2',
    '720p': '1280:-2',
    '1080p': '1920:-2',
};

const parseForm = async (req) => new Promise((resolve, reject) => {
    const form = new IncomingForm({
        maxFileSize: MAX_FILE_SIZE_BYTES,
        keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            reject(err);
            return;
        }

        resolve({ fields, files });
    });
});

const getFieldValue = (field) => {
    if (Array.isArray(field)) return field[0];
    return field;
};

const parseInteger = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeFormat = (format) => {
    const normalized = String(format || 'mp4').toLowerCase();
    if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif'].includes(normalized)) return normalized;
    throw createClientError(`Unsupported video output format: ${format}`, 'UNSUPPORTED_VIDEO_FORMAT');
};

const getDuration = async (filePath) => {
    try {
        const { stdout } = await execFileAsync('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            filePath,
        ]);
        const duration = Number.parseFloat(stdout);
        if (!Number.isFinite(duration)) return 'N/A';
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch {
        return 'N/A';
    }
};

function createClientError(message, code, status = 400, details = undefined) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
}

function createServerError(message, code, status = 503, details = undefined) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
}

function getQualityPreset(quality) {
    return QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;
}

function maybeScaleArgs(scale) {
    return scale ? ['-vf', `scale=${scale}`] : [];
}

function getCodecArgs(outputFormat, quality) {
    const preset = getQualityPreset(quality);

    switch (outputFormat) {
        case 'mp4':
            return ['-c:v', 'libx264', '-preset', 'medium', '-crf', preset.crf, '-c:a', 'aac', '-b:a', preset.audioBitrate];
        case 'webm':
            return ['-c:v', 'libvpx-vp9', '-b:v', preset.videoBitrate, '-c:a', 'libopus', '-b:a', preset.audioBitrate];
        case 'avi':
            return ['-c:v', 'mpeg4', '-q:v', quality === 'high' ? '3' : quality === 'medium' ? '5' : '7', '-c:a', 'libmp3lame', '-b:a', preset.audioBitrate];
        case 'mov':
            return ['-c:v', 'libx264', '-preset', 'medium', '-crf', preset.crf, '-c:a', 'aac', '-b:a', preset.audioBitrate];
        case 'mkv':
            return ['-c:v', 'libx264', '-preset', 'medium', '-crf', preset.crf, '-c:a', 'aac', '-b:a', preset.audioBitrate];
        default:
            throw createClientError(`Unsupported video output format: ${outputFormat}`, 'UNSUPPORTED_VIDEO_FORMAT');
    }
}

async function convertVideo(inputPath, outputPath, outputFormat, quality) {
    await execFileAsync('ffmpeg', [
        '-y',
        '-i', inputPath,
        ...getCodecArgs(outputFormat, quality),
        outputPath,
    ]);
}

async function compressVideo(inputPath, outputPath, quality, resolution) {
    const preset = getQualityPreset(quality);
    const scale = RESOLUTION_PRESETS[resolution] ?? RESOLUTION_PRESETS.original;

    await execFileAsync('ffmpeg', [
        '-y',
        '-i', inputPath,
        ...maybeScaleArgs(scale),
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', preset.crf,
        '-b:v', preset.videoBitrate,
        '-c:a', 'aac',
        '-b:a', preset.audioBitrate,
        outputPath,
    ]);
}

async function convertVideoToGif(inputPath, outputPath, width, fps) {
    const palettePath = path.join(os.tmpdir(), `palette_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
    const scale = `${Math.max(160, width)}:-1`;

    try {
        await execFileAsync('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-vf', `fps=${fps},scale=${scale}:flags=lanczos,palettegen`,
            palettePath,
        ]);

        await execFileAsync('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-i', palettePath,
            '-lavfi', `fps=${fps},scale=${scale}:flags=lanczos[x];[x][1:v]paletteuse`,
            outputPath,
        ]);
    } finally {
        if (fs.existsSync(palettePath)) {
            try {
                fs.unlinkSync(palettePath);
            } catch {
                // ignore cleanup failure
            }
        }
    }
}

async function transformVideoFile(filePath, fields) {
    const operation = getFieldValue(fields.operation) || 'convert';
    const quality = getFieldValue(fields.quality) || 'high';

    if (!QUALITY_PRESETS[quality]) {
        throw createClientError('Invalid quality preset.', 'INVALID_QUALITY');
    }

    if (operation === 'convert') {
        const outputFormat = normalizeFormat(getFieldValue(fields.outputFormat) || 'mp4');
        const outputPath = path.join(os.tmpdir(), `video_${Date.now()}_${Math.random().toString(36).slice(2)}.${outputFormat}`);
        await convertVideo(filePath, outputPath, outputFormat, quality);
        return { outputPath, outputFormat };
    }

    if (operation === 'compress') {
        const resolution = getFieldValue(fields.resolution) || 'original';
        if (!(resolution in RESOLUTION_PRESETS)) {
            throw createClientError('Invalid resolution preset.', 'INVALID_RESOLUTION');
        }

        const outputFormat = 'mp4';
        const outputPath = path.join(os.tmpdir(), `video_${Date.now()}_${Math.random().toString(36).slice(2)}.${outputFormat}`);
        await compressVideo(filePath, outputPath, quality, resolution);
        return { outputPath, outputFormat };
    }

    if (operation === 'gif') {
        const width = parseInteger(getFieldValue(fields.width), 480);
        const frameDelay = parseInteger(getFieldValue(fields.frameDelay), 100);
        const fps = Math.max(1, Math.min(20, Math.round(1000 / Math.max(50, frameDelay))));
        const outputFormat = 'gif';
        const outputPath = path.join(os.tmpdir(), `video_${Date.now()}_${Math.random().toString(36).slice(2)}.${outputFormat}`);
        await convertVideoToGif(filePath, outputPath, width, fps);
        return { outputPath, outputFormat };
    }

    throw createClientError(`Unsupported video operation: ${operation}`, 'UNSUPPORTED_VIDEO_OPERATION');
}

function mapExecutionError(error) {
    const message = error?.message || 'Video transformation failed.';

    if (error?.code === 'ENOENT') {
        return createServerError(
            'Server video runtime is not available on this deployment.',
            'RUNTIME_NOT_FOUND',
            503
        );
    }

    if (/Invalid data found/i.test(message) || /could not find codec parameters/i.test(message)) {
        return createClientError('The uploaded video file could not be processed.', 'INVALID_FILE');
    }

    if (/Unknown encoder/i.test(message) || /Unable to find a suitable output format/i.test(message)) {
        return createServerError('This deployment cannot encode the requested video format.', 'RUNTIME_NOT_CONFIGURED', 503);
    }

    return createServerError('Video transformation failed.', 'VIDEO_TRANSFORM_FAILED', 500);
}

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

    let inputPath = null;
    let outputPath = null;

    try {
        const { fields, files } = await parseForm(req);
        const videoFile = files[VIDEO_UPLOAD_FIELD]?.[0] || files[VIDEO_UPLOAD_FIELD];

        if (!videoFile) {
            throw createClientError('No video file provided.', 'INVALID_FILE');
        }

        inputPath = videoFile.filepath;
        const originalSize = videoFile.size || fs.statSync(inputPath).size;
        const duration = await getDuration(inputPath);
        const result = await transformVideoFile(inputPath, fields);
        outputPath = result.outputPath;

        const outputBuffer = fs.readFileSync(outputPath);
        const outputSize = outputBuffer.length;
        const outputName = `${path.parse(videoFile.originalFilename || videoFile.newFilename || 'video').name}.${result.outputFormat}`;

        res.setHeader('Content-Type', MIME_BY_FORMAT[result.outputFormat] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
        res.setHeader('X-Original-Size', String(originalSize));
        res.setHeader('X-Output-Size', String(outputSize));
        res.setHeader('X-Duration', duration);
        res.setHeader('X-Output-Format', result.outputFormat);

        return res.status(200).send(outputBuffer);
    } catch (rawError) {
        const error = rawError?.code || rawError?.status ? rawError : mapExecutionError(rawError);
        return res.status(error.status || 500).json({
            error: error.message || 'Video transformation failed.',
            code: error.code || 'VIDEO_TRANSFORM_FAILED',
            details: error.details,
        });
    } finally {
        [inputPath, outputPath].forEach((filePath) => {
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch {
                    // ignore cleanup failures
                }
            }
        });
    }
}
