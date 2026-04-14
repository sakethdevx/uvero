/**
 * Video Converter Worker
 * Uses FFmpeg.wasm for video format conversion
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;

// Quality to bitrate mapping
const qualitySettings = {
    low: { videoBitrate: '1M', audioBitrate: '96k' },
    medium: { videoBitrate: '2M', audioBitrate: '128k' },
    high: { videoBitrate: '4M', audioBitrate: '192k' }
};

// Format-specific codec settings
const formatCodecs = {
    mp4: { videoCodec: 'libx264', audioCodec: 'aac', extraArgs: ['-movflags', '+faststart'] },
    webm: { videoCodec: 'libvpx-vp9', audioCodec: 'libopus', extraArgs: ['-deadline', 'good'] },
    avi: { videoCodec: 'mpeg4', audioCodec: 'mp3', extraArgs: [] },
    mov: { videoCodec: 'libx264', audioCodec: 'aac', extraArgs: ['-movflags', '+faststart'] },
    mkv: { videoCodec: 'libx264', audioCodec: 'aac', extraArgs: [] }
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
    const { type, arrayBuffer, outputFormat, quality, fileName } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        // Initialize FFmpeg
        self.postMessage({ type: 'progress', progress: 5 });

        await initFFmpeg((progress) => {
            const mappedProgress = 20 + (progress * 0.7);
            self.postMessage({ type: 'progress', progress: Math.round(mappedProgress) });
        });

        self.postMessage({ type: 'progress', progress: 15 });

        // Get input file extension
        const inputExt = fileName ? fileName.split('.').pop().toLowerCase() : 'mp4';
        const inputName = `input.${inputExt}`;
        const outputName = `output.${outputFormat}`;

        // Write input file to FFmpeg file system
        await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));

        self.postMessage({ type: 'progress', progress: 20 });

        // Get codec settings for output format
        const codecSettings = formatCodecs[outputFormat] || formatCodecs.mp4;
        const qualityConfig = qualitySettings[quality] || qualitySettings.medium;

        // Build FFmpeg command
        const args = [
            '-i', inputName,
            '-c:v', codecSettings.videoCodec,
            '-b:v', qualityConfig.videoBitrate,
            '-c:a', codecSettings.audioCodec,
            '-b:a', qualityConfig.audioBitrate,
            ...codecSettings.extraArgs,
            outputName
        ];

        // Execute FFmpeg command
        await ffmpeg.exec(args);

        self.postMessage({ type: 'progress', progress: 90 });

        // Read output file
        const data = await ffmpeg.readFile(outputName);

        // Determine MIME type
        const mimeTypes = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            avi: 'video/x-msvideo',
            mov: 'video/quicktime',
            mkv: 'video/x-matroska'
        };
        const mimeType = mimeTypes[outputFormat] || 'video/mp4';

        const blob = new Blob([data.buffer], { type: mimeType });

        // Clean up
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: { blob }
        });

    } catch (error) {
        console.error('Video conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert video'
        });
    }
});