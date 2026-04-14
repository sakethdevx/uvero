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

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const AUDIO_UPLOAD_FIELD = 'audio';

const MIME_BY_FORMAT = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
};

const CODEC_ARGS_BY_FORMAT = {
    mp3: (bitrate) => ['-codec:a', 'libmp3lame', '-b:a', `${bitrate}k`],
    wav: () => ['-codec:a', 'pcm_s16le', '-ar', '44100'],
    ogg: (bitrate) => ['-codec:a', 'libvorbis', '-b:a', `${bitrate}k`],
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

export const normalizeAudioFormat = (format) => {
    const normalized = String(format || 'mp3').toLowerCase();
    if (normalized === 'mpeg') return 'mp3';
    if (normalized === 'wave') return 'wav';
    if (['mp3', 'wav', 'ogg'].includes(normalized)) return normalized;
    throw createClientError(`Unsupported audio output format: ${format}`, 'UNSUPPORTED_AUDIO_FORMAT');
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

async function convertAudio(inputPath, outputPath, format, bitrate) {
    const codecArgs = CODEC_ARGS_BY_FORMAT[format];
    if (!codecArgs) {
        throw createClientError(`Unsupported output format: ${format}`, 'UNSUPPORTED_AUDIO_FORMAT');
    }

    await execFileAsync('ffmpeg', [
        '-y',
        '-i', inputPath,
        ...codecArgs(bitrate),
        outputPath,
    ]);
}

async function transformAudioFile(filePath, fields) {
    const operation = getFieldValue(fields.operation) || 'convert';
    const outputFormat = operation === 'compress'
        ? 'mp3'
        : normalizeAudioFormat(getFieldValue(fields.outputFormat) || 'mp3');
    const bitrate = parseInteger(getFieldValue(fields.bitrate), operation === 'compress' ? 128 : 192);
    const outputPath = path.join(os.tmpdir(), `audio_${Date.now()}_${Math.random().toString(36).slice(2)}.${outputFormat}`);

    if (!Number.isFinite(bitrate) || bitrate < 64 || bitrate > 320) {
        throw createClientError('Bitrate must be between 64 and 320 kbps.', 'INVALID_BITRATE');
    }

    await convertAudio(filePath, outputPath, outputFormat, bitrate);

    return {
        outputPath,
        outputFormat,
        bitrate,
    };
}

export function classifyTransformAudioError(error) {
    const message = error?.message || 'Audio transformation failed.';

    if (error?.code === 'ENOENT') {
        return createServerError(
            'Server audio runtime is not available on this deployment.',
            'RUNTIME_NOT_FOUND',
            503
        );
    }

    if (/Invalid data found/i.test(message) || /could not find codec parameters/i.test(message)) {
        return createClientError('The uploaded audio file could not be processed.', 'INVALID_FILE');
    }

    if (/Unknown encoder/i.test(message) || /Unable to find a suitable output format/i.test(message)) {
        return createServerError('This deployment cannot encode the requested audio format.', 'RUNTIME_NOT_CONFIGURED', 503);
    }

    return createServerError('Audio transformation failed.', 'AUDIO_TRANSFORM_FAILED', 500);
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
        const audioFile = files[AUDIO_UPLOAD_FIELD]?.[0] || files[AUDIO_UPLOAD_FIELD];

        if (!audioFile) {
            throw createClientError('No audio file provided.', 'INVALID_FILE');
        }

        inputPath = audioFile.filepath;
        const originalSize = audioFile.size || fs.statSync(inputPath).size;
        const duration = await getDuration(inputPath);
        const result = await transformAudioFile(inputPath, fields);
        outputPath = result.outputPath;

        const outputBuffer = fs.readFileSync(outputPath);
        const outputSize = outputBuffer.length;
        const outputName = `${path.parse(audioFile.originalFilename || audioFile.newFilename || 'audio').name}.${result.outputFormat}`;

        res.setHeader('Content-Type', MIME_BY_FORMAT[result.outputFormat] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
        res.setHeader('X-Original-Size', String(originalSize));
        res.setHeader('X-Output-Size', String(outputSize));
        res.setHeader('X-Duration', duration);
        res.setHeader('X-Output-Format', result.outputFormat);
        res.setHeader('X-Bitrate', String(result.bitrate));

        return res.status(200).send(outputBuffer);
    } catch (rawError) {
        const error = rawError?.code || rawError?.status ? rawError : classifyTransformAudioError(rawError);
        return res.status(error.status || 500).json({
            error: error.message || 'Audio transformation failed.',
            code: error.code || 'AUDIO_TRANSFORM_FAILED',
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
