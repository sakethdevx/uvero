import sharp from 'sharp';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

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

const parseInteger = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseFloatValue = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return value === true || value === 'true' || value === '1';
};

const MIME_BY_FORMAT = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

const normalizeOutputFormat = (value, fallback = 'png') => {
    const normalized = (value || fallback).toLowerCase();
    if (normalized === 'jpg') return 'jpeg';
    if (['jpeg', 'png', 'webp'].includes(normalized)) return normalized;
    throw new Error(`Unsupported output format: ${value}`);
};

const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function resolvePosition(position, overlayWidth, overlayHeight, baseWidth, baseHeight, margin = 24) {
    const centerX = Math.round((baseWidth - overlayWidth) / 2);
    const centerY = Math.round((baseHeight - overlayHeight) / 2);
    const rightX = Math.max(margin, baseWidth - overlayWidth - margin);
    const bottomY = Math.max(margin, baseHeight - overlayHeight - margin);

    switch (position) {
        case 'top-left':
            return { x: margin, y: margin };
        case 'top-center':
            return { x: centerX, y: margin };
        case 'top-right':
            return { x: rightX, y: margin };
        case 'center-left':
            return { x: margin, y: centerY };
        case 'center':
            return { x: centerX, y: centerY };
        case 'center-right':
            return { x: rightX, y: centerY };
        case 'bottom-left':
            return { x: margin, y: bottomY };
        case 'bottom-center':
            return { x: centerX, y: bottomY };
        case 'bottom-right':
        default:
            return { x: rightX, y: bottomY };
    }
}

async function transformConvert(buffer, metadata, fields) {
    const outputFormat = normalizeOutputFormat(getFieldValue(fields.outputFormat), metadata.format || 'png');
    const width = parseInteger(getFieldValue(fields.width), null);
    const height = parseInteger(getFieldValue(fields.height), null);
    const maintainAspectRatio = parseBoolean(getFieldValue(fields.maintainAspectRatio), true);
    const quality = parseInteger(getFieldValue(fields.quality), 92);

    let pipeline = sharp(buffer).rotate();

    if (width || height) {
        pipeline = pipeline.resize({
            width,
            height,
            fit: maintainAspectRatio ? 'inside' : 'fill',
            withoutEnlargement: false,
        });
    }

    if (outputFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (outputFormat === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else if (outputFormat === 'webp') {
        pipeline = pipeline.webp({ quality });
    }

    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
        buffer: outputBuffer,
        format: outputFormat,
        contentType: MIME_BY_FORMAT[outputFormat],
        metadata: outputMetadata,
    };
}

async function transformResize(buffer, metadata, fields) {
    const width = parseInteger(getFieldValue(fields.width), null);
    const height = parseInteger(getFieldValue(fields.height), null);

    if (!width || !height) {
        throw new Error('Width and height are required for resizing.');
    }

    const sourceFormat = (metadata.format || 'png').toLowerCase();
    const outputFormat = ['jpeg', 'jpg', 'png', 'webp'].includes(sourceFormat)
        ? normalizeOutputFormat(sourceFormat)
        : 'png';
    let pipeline = sharp(buffer).rotate().resize({
        width,
        height,
        fit: 'fill',
    });

    if (outputFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
    } else if (outputFormat === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (outputFormat === 'webp') {
        pipeline = pipeline.webp({ quality: 92 });
    }

    const outputBuffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
        buffer: outputBuffer,
        format: outputFormat,
        contentType: MIME_BY_FORMAT[outputFormat],
        metadata: outputMetadata,
    };
}

async function createWatermarkOverlaySvg(fields, files, baseMetadata) {
    const watermarkType = getFieldValue(fields.type) || 'text';
    const opacity = Math.min(1, Math.max(0.1, parseFloatValue(getFieldValue(fields.opacity), 0.5)));
    const position = getFieldValue(fields.position) || 'bottom-right';
    const baseWidth = baseMetadata.width || 1;
    const baseHeight = baseMetadata.height || 1;

    if (watermarkType === 'image') {
        const watermarkFile = files.watermarkImage?.[0] || files.watermarkImage;
        if (!watermarkFile) {
            throw new Error('A watermark image is required for image watermark mode.');
        }

        const watermarkBuffer = fs.readFileSync(watermarkFile.filepath);
        const watermarkImage = sharp(watermarkBuffer);
        const watermarkMetadata = await watermarkImage.metadata();
        const maxWidth = Math.max(48, Math.round(baseWidth * 0.24));
        const resizeRatio = Math.min(1, maxWidth / (watermarkMetadata.width || maxWidth));
        const overlayWidth = Math.max(24, Math.round((watermarkMetadata.width || maxWidth) * resizeRatio));
        const overlayHeight = Math.max(24, Math.round((watermarkMetadata.height || overlayWidth) * resizeRatio));
        const positionCoords = resolvePosition(position, overlayWidth, overlayHeight, baseWidth, baseHeight);
        const watermarkMime = watermarkMetadata.format === 'svg' ? 'image/svg+xml' : (MIME_BY_FORMAT[watermarkMetadata.format] || watermarkFile.mimetype || 'image/png');
        const watermarkBase64 = watermarkBuffer.toString('base64');

        return `
            <svg width="${baseWidth}" height="${baseHeight}" viewBox="0 0 ${baseWidth} ${baseHeight}" xmlns="http://www.w3.org/2000/svg">
                <image
                    href="data:${watermarkMime};base64,${watermarkBase64}"
                    x="${positionCoords.x}"
                    y="${positionCoords.y}"
                    width="${overlayWidth}"
                    height="${overlayHeight}"
                    opacity="${opacity}"
                    preserveAspectRatio="xMidYMid meet"
                />
            </svg>
        `;
    }

    const text = escapeXml(getFieldValue(fields.text) || '© Your Company');
    const fontSize = Math.max(12, parseInteger(getFieldValue(fields.fontSize), 48));
    const color = escapeXml(getFieldValue(fields.color) || '#ffffff');
    const estimatedWidth = Math.max(fontSize * 2, Math.round(text.length * fontSize * 0.62));
    const estimatedHeight = Math.round(fontSize * 1.4);
    const positionCoords = resolvePosition(position, estimatedWidth, estimatedHeight, baseWidth, baseHeight);

    return `
        <svg width="${baseWidth}" height="${baseHeight}" viewBox="0 0 ${baseWidth} ${baseHeight}" xmlns="http://www.w3.org/2000/svg">
            <text
                x="${positionCoords.x}"
                y="${positionCoords.y + fontSize}"
                font-family="Arial, Helvetica, sans-serif"
                font-size="${fontSize}"
                font-weight="700"
                fill="${color}"
                opacity="${opacity}"
            >${text}</text>
        </svg>
    `;
}

async function transformWatermark(buffer, metadata, fields, files) {
    const overlaySvg = await createWatermarkOverlaySvg(fields, files, metadata);
    const outputBuffer = await sharp(buffer)
        .rotate()
        .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
        .png()
        .toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
        buffer: outputBuffer,
        format: 'png',
        contentType: 'image/png',
        metadata: outputMetadata,
    };
}

async function applyImageTransform(operation, buffer, metadata, fields, files) {
    switch (operation) {
        case 'convert':
            return transformConvert(buffer, metadata, fields);
        case 'resize':
            return transformResize(buffer, metadata, fields);
        case 'watermark':
            return transformWatermark(buffer, metadata, fields, files);
        default:
            throw new Error(`Unsupported transform operation: ${operation}`);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
        });
    }

    let imagePath;
    let watermarkPath;

    try {
        const { fields, files } = await parseForm(req);
        const imageFile = files.image?.[0] || files.image;
        const operation = getFieldValue(fields.operation);

        if (!imageFile) {
            return res.status(400).json({
                error: 'No image file provided.',
                code: 'INVALID_FILE',
            });
        }

        if (!operation) {
            return res.status(400).json({
                error: 'No transform operation provided.',
                code: 'INVALID_OPERATION',
            });
        }

        imagePath = imageFile.filepath;
        watermarkPath = (files.watermarkImage?.[0] || files.watermarkImage)?.filepath;

        const inputBuffer = fs.readFileSync(imagePath);
        const inputMetadata = await sharp(inputBuffer).metadata();
        const transformed = await applyImageTransform(operation, inputBuffer, inputMetadata, fields, files);
        const outputSize = transformed.buffer.length;

        res.setHeader('Content-Type', transformed.contentType);
        res.setHeader('X-Original-Size', String(inputBuffer.length));
        res.setHeader('X-Output-Size', String(outputSize));
        res.setHeader('X-Original-Width', String(inputMetadata.width || ''));
        res.setHeader('X-Original-Height', String(inputMetadata.height || ''));
        res.setHeader('X-Output-Width', String(transformed.metadata.width || ''));
        res.setHeader('X-Output-Height', String(transformed.metadata.height || ''));
        res.setHeader('X-Output-Format', transformed.format);

        return res.status(200).send(transformed.buffer);
    } catch (error) {
        console.error('Image transform error:', error);
        return res.status(500).json({
            error: error.message || 'Image transform failed.',
            code: 'TRANSFORM_FAILED',
        });
    } finally {
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        if (watermarkPath && fs.existsSync(watermarkPath)) {
            fs.unlinkSync(watermarkPath);
        }
    }
}
