/**
 * GIF Maker Worker
 * Creates animated GIFs from images or videos using gif.js and FFmpeg.wasm
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import GIF from 'gif.js';

let ffmpeg = null;
let ffmpegLoaded = false;

// Initialize FFmpeg once
async function initFFmpeg() {
    if (ffmpegLoaded) return;

    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => console.log(message));
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
}

// Create GIF from images using Canvas and gif.js
async function createGIFFromImages(imageBuffers, options) {
    self.postMessage({ type: 'progress', progress: 10 });

    const { frameDelay, quality, width, loop } = options;

    // Load images
    const images = await Promise.all(
        imageBuffers.map(buffer => {
            return new Promise((resolve, reject) => {
                const blob = new Blob([buffer]);
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(blob);
            });
        })
    );

    self.postMessage({ type: 'progress', progress: 30 });

    // Calculate dimensions maintaining aspect ratio
    const firstImg = images[0];
    const aspectRatio = firstImg.height / firstImg.width;
    const height = Math.round(width * aspectRatio);

    // Create GIF encoder
    const gif = new GIF({
        workers: 2,
        quality: quality,
        width: width,
        height: height,
        repeat: loop
    });

    // Track GIF creation progress
    gif.on('progress', (p) => {
        const mappedProgress = 30 + (p * 60);
        self.postMessage({ type: 'progress', progress: Math.round(mappedProgress) });
    });

    // Create canvas and add frames
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    for (const img of images) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw image scaled to fit
        ctx.drawImage(img, 0, 0, width, height);

        // Add frame to GIF
        gif.addFrame(ctx, { delay: frameDelay, copy: true });
    }

    self.postMessage({ type: 'progress', progress: 90 });

    // Render GIF
    return new Promise((resolve, reject) => {
        gif.on('finished', (blob) => {
            self.postMessage({ type: 'progress', progress: 100 });
            resolve(blob);
        });
        gif.on('abort', () => reject(new Error('GIF creation aborted')));
        gif.render();
    });
}

// Create GIF from video using FFmpeg
async function createGIFFromVideo(videoBuffer, fileName, options) {
    self.postMessage({ type: 'progress', progress: 5 });

    await initFFmpeg();

    self.postMessage({ type: 'progress', progress: 15 });

    const { width, loop } = options;

    // Get input file extension
    const ext = fileName ? fileName.split('.').pop().toLowerCase() : 'mp4';
    const inputName = `input.${ext}`;
    const outputName = `output.gif`;

    // Write input video
    await ffmpeg.writeFile(inputName, new Uint8Array(videoBuffer));

    self.postMessage({ type: 'progress', progress: 20 });

    // Build FFmpeg command for GIF creation
    // Use palettegen for better colors
    const paletteFile = 'palette.png';

    // Generate palette
    await ffmpeg.exec([
        '-i', inputName,
        '-vf', `fps=10,scale=${width}:-1:flags=lanczos,palettegen`,
        paletteFile
    ]);

    self.postMessage({ type: 'progress', progress: 50 });

    // Create GIF with palette
    const loopArg = loop === 0 ? '0' : loop.toString();
    await ffmpeg.exec([
        '-i', inputName,
        '-i', paletteFile,
        '-filter_complex', `fps=10,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
        '-loop', loopArg,
        outputName
    ]);

    self.postMessage({ type: 'progress', progress: 90 });

    // Read output GIF
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'image/gif' });

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(paletteFile);
    await ffmpeg.deleteFile(outputName);

    self.postMessage({ type: 'progress', progress: 100 });

    return blob;
}

self.addEventListener('message', async (e) => {
    const { type, imageBuffers, videoBuffer, fileName, options } = e.data;

    try {
        let blob;

        if (type === 'createFromImages') {
            blob = await createGIFFromImages(imageBuffers, options);
        } else if (type === 'createFromVideo') {
            blob = await createGIFFromVideo(videoBuffer, fileName, options);
        } else {
            throw new Error('Unknown operation type');
        }

        self.postMessage({
            type: 'success',
            data: { blob }
        });

    } catch (error) {
        console.error('GIF creation error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to create GIF'
        });
    }
});