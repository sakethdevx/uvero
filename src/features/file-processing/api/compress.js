/**
 * Vercel Serverless Function for Image Compression
 * Endpoint: /api/compress
 * Method: POST
 * Body: multipart/form-data with 'image' field and 'quality' parameter
 */

import sharp from 'sharp';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Disable Next.js body parsing to handle multipart/form-data
export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * Parse multipart form data
 */
const parseForm = async (req) => {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm({
            maxFileSize: 50 * 1024 * 1024, // 50MB limit
            keepExtensions: true,
        });

        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
};

/**
 * Main handler
 */
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse the multipart form data
        const { fields, files } = await parseForm(req);

        // Get the uploaded file
        const imageFile = files.image?.[0] || files.image;
        if (!imageFile) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Get quality parameter (default 80)
        const quality = parseInt(fields.quality?.[0] || fields.quality || 80);

        // Read the uploaded file
        const fileBuffer = fs.readFileSync(imageFile.filepath);

        // Get original file size
        const originalSize = fileBuffer.length;

        // Detect image format
        const metadata = await sharp(fileBuffer).metadata();
        const format = metadata.format;

        // Compress the image using Sharp
        let compressedBuffer;

        if (format === 'jpeg' || format === 'jpg') {
            compressedBuffer = await sharp(fileBuffer)
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        } else if (format === 'png') {
            compressedBuffer = await sharp(fileBuffer)
                .png({
                    quality,
                    compressionLevel: 9,
                    palette: true
                })
                .toBuffer();
        } else if (format === 'webp') {
            compressedBuffer = await sharp(fileBuffer)
                .webp({ quality })
                .toBuffer();
        } else {
            // For other formats, convert to JPEG
            compressedBuffer = await sharp(fileBuffer)
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        }

        // Calculate compression stats
        const compressedSize = compressedBuffer.length;
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

        // Clean up temporary file
        fs.unlinkSync(imageFile.filepath);

        // Get MIME type
        const mimeTypes = {
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
        };
        const mimeType = mimeTypes[format] || 'image/jpeg';

        // Return compressed image
        res.setHeader('Content-Type', mimeType);
        res.setHeader('X-Original-Size', originalSize.toString());
        res.setHeader('X-Compressed-Size', compressedSize.toString());
        res.setHeader('X-Reduction', reduction.toString());

        return res.status(200).send(compressedBuffer);
    } catch (error) {
        console.error('Compression error:', error);
        return res.status(500).json({
            error: 'Compression failed',
            message: error.message
        });
    }
}
