/**
 * Video Compressor Worker
 * Uses FFmpeg.wasm for real video compression
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;

// Quality to CRF mapping (lower CRF = higher quality)
const qualityToCRF = {
    low: 32,        // Highest compression, lowest quality
    medium: 28,     // Balanced
    high: 23,       // Good quality
    'very-high': 18,// Very good quality
    max: 15         // Minimal compression, best quality
};

// Initialize FFmpeg once
async function initFFmpeg(onProgress) {
    if (isLoaded) return;

    if (!ffmpeg) {
        ffmpeg = new FFmpeg();

        // Log FFmpeg messages
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });

        // Track progress
        ffmpeg.on('progress', ({ progress }) => {
            if (onProgress) {
                // FFmpeg progress is 0-1, convert to percentage
                onProgress(Math.round(progress * 100));
            }
        });
    }

    // Load FFmpeg core from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    isLoaded = true;
}

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, quality, resolution, fileName } = e.data;

    if (type !== 'compress') {
        return;
    }

    try {
        // Initialize FFmpeg (only once)
        self.postMessage({ type: 'progress', progress: 5 });

        await initFFmpeg((progress) => {
            // Map FFmpeg progress (20-90%) to leave room for initialization and finalization
            const mappedProgress = 20 + (progress * 0.7);
            self.postMessage({ type: 'progress', progress: Math.round(mappedProgress) });
        });

        self.postMessage({ type: 'progress', progress: 15 });

        // Get file extension
        const ext = fileName ? fileName.split('.').pop().toLowerCase() : 'mp4';
        const inputName = `input.${ext}`;
        const outputName = `output.mp4`;

        // Write input file to FFmpeg file system
        await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));

        self.postMessage({ type: 'progress', progress: 20 });

        // Build FFmpeg command
        const crf = qualityToCRF[quality] || 23;
        const args = ['-i', inputName];

        // Add resolution filter if needed
        if (resolution && resolution !== 'original') {
            const [width, height] = resolution.split('x');
            args.push('-vf', `scale=${width}:${height}`);
        }

        // Add compression settings
        args.push(
            '-c:v', 'libx264',      // H.264 codec
            '-crf', crf.toString(), // Quality setting
            '-preset', 'medium',    // Encoding speed/compression balance
            '-c:a', 'aac',          // Audio codec
            '-b:a', '128k',         // Audio bitrate
            '-movflags', '+faststart', // Enable progressive streaming
            outputName
        );

        // Execute FFmpeg command
        await ffmpeg.exec(args);

        self.postMessage({ type: 'progress', progress: 90 });

        // Read output file
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });

        // Clean up
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        self.postMessage({ type: 'progress', progress: 100 });

        // Calculate compression ratio
        const originalSize = arrayBuffer.byteLength;
        const compressedSize = data.buffer.byteLength;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        self.postMessage({
            type: 'success',
            data: {
                blob,
                originalSize,
                compressedSize,
                compressionRatio: parseFloat(compressionRatio)
            }
        });

    } catch (error) {
        console.error('Video compression error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to compress video'
        });
    }
});
