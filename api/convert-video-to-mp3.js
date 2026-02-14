/**
 * Vercel Serverless Function for Video to MP3 Conversion
 * Endpoint: /api/convert-video-to-mp3
 * Method: POST
 * Body: multipart/form-data with 'video' field and 'bitrate' parameter
 */

import { IncomingForm } from 'formidable';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

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
            maxFileSize: 500 * 1024 * 1024, // 500MB limit
            keepExtensions: true,
        });

        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
};

/**
 * Get video duration using ffprobe
 */
const getVideoDuration = async (videoPath) => {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
        );
        const duration = parseFloat(stdout);
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch {
        return 'N/A';
    }
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

    let tempVideoPath = null;
    let tempAudioPath = null;

    try {
        // Parse the multipart form data
        const { fields, files } = await parseForm(req);

        // Get the uploaded file
        const videoFile = files.video?.[0] || files.video;
        if (!videoFile) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        // Get bitrate parameter (default 192 kbps)
        const bitrate = parseInt(fields.bitrate?.[0] || fields.bitrate || 192);

        tempVideoPath = videoFile.filepath;

        // Get video duration
        const duration = await getVideoDuration(tempVideoPath);

        // Create output path for MP3
        tempAudioPath = path.join(os.tmpdir(), `audio_${Date.now()}.mp3`);

        // Convert video to MP3 using ffmpeg
        // -vn: no video
        // -ar: audio sample rate (44100 or 48000)
        // -ab: audio bitrate
        // -f: force format
        const sampleRate = bitrate >= 192 ? 48000 : 44100;
        await execAsync(
            `ffmpeg -i "${tempVideoPath}" -vn -ar ${sampleRate} -ab ${bitrate}k -f mp3 "${tempAudioPath}"`
        );

        // Read the converted audio file
        const audioBuffer = fs.readFileSync(tempAudioPath);
        const audioSize = audioBuffer.length;

        // Clean up temporary input file
        fs.unlinkSync(tempVideoPath);
        tempVideoPath = null;

        // Set response headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('X-Audio-Size', audioSize.toString());
        res.setHeader('X-Duration', duration);
        res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');

        // Send the MP3 file
        res.status(200).send(audioBuffer);

        // Clean up temporary output file
        fs.unlinkSync(tempAudioPath);
        tempAudioPath = null;

    } catch (error) {
        console.error('Conversion error:', error);

        // Clean up temporary files on error
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            try { fs.unlinkSync(tempVideoPath); } catch { /* ignore cleanup errors */ }
        }
        if (tempAudioPath && fs.existsSync(tempAudioPath)) {
            try { fs.unlinkSync(tempAudioPath); } catch { /* ignore cleanup errors */ }
        }

        return res.status(500).json({
            error: 'Conversion failed',
            message: error.message
        });
    }
}
