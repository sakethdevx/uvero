/**
 * Vercel Serverless Function for HEIC/HEIF to JPG Conversion
 * Endpoint: /api/convert-heic
 * Method: POST
 * Body: multipart/form-data with 'image' field and 'quality' parameter
 */

import { IncomingForm } from 'formidable';
import sharp from 'sharp';
import fs from 'fs';

// Disable Next.js/Vercel default body parsing to handle multipart/form-data
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let tempImagePath = null;

    try {
        const { fields, files } = await parseForm(req);

        const imageFile = files.image?.[0] || files.image;
        if (!imageFile) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Parse quality (default 92)
        const qualityParam = fields.quality?.[0] || fields.quality || 0.92;
        const quality = Math.round(parseFloat(qualityParam) * 100);

        tempImagePath = imageFile.filepath;

        // Convert HEIC to JPG using sharp
        const jpgBuffer = await sharp(tempImagePath)
            .jpeg({ quality })
            .toBuffer();

        // Clean up temp file
        try {
            fs.unlinkSync(tempImagePath);
        } catch {
            // ignore cleanup errors
        }

        // Send the JPG file
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Image-Size', jpgBuffer.length.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="converted.jpg"');
        res.status(200).send(jpgBuffer);

    } catch (error) {
        console.error('[convert-heic] error:', error);

        if (tempImagePath && fs.existsSync(tempImagePath)) {
            try {
                fs.unlinkSync(tempImagePath);
            } catch {
                // ignore
            }
        }

        return res.status(500).json({
            error: 'Conversion failed',
            message: error.message
        });
    }
}
