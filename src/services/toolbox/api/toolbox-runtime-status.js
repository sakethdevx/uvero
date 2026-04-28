import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getToolMetadata } from '../core/toolMetadata.js';

function getEpubToMobiStatus() {
    const binaryPath = process.env.EPUB_TO_MOBI_BINARY_PATH;
    const metadata = getToolMetadata('epub-to-mobi');

    if (!binaryPath) {
        return {
            available: false,
            status: 'deployment_required',
            runtime: null,
            note: metadata.availabilityNote,
            limits: metadata.limits,
        };
    }

    if (!fs.existsSync(binaryPath)) {
        return {
            available: false,
            status: 'deployment_required',
            runtime: path.basename(binaryPath),
            note: 'A MOBI converter path is configured, but the runtime binary was not found on this deployment.',
            limits: metadata.limits,
        };
    }

    return {
        available: true,
        status: 'ready',
        runtime: path.basename(binaryPath),
        note: 'Server-side MOBI conversion runtime is configured and ready.',
        limits: metadata.limits,
    };
}

function getRarToZipStatus() {
    const metadata = getToolMetadata('rar-to-zip');

    return {
        available: true,
        status: 'limited',
        runtime: null,
        note: metadata.availabilityNote,
        limits: metadata.limits,
    };
}

function isBinaryReady(binaryName) {
    try {
        execFileSync(binaryName, ['-version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function getMediaRuntimeStatus(label) {
    const ffmpegReady = isBinaryReady('ffmpeg');
    const ffprobeReady = isBinaryReady('ffprobe');
    const runtime = [ffmpegReady ? 'ffmpeg' : null, ffprobeReady ? 'ffprobe' : null].filter(Boolean).join(' + ') || null;

    if (ffmpegReady && ffprobeReady) {
        return {
            available: true,
            status: 'ready',
            runtime,
            note: `${label} online processing runtime is configured and ready on this deployment.`,
            limits: ['Large uploads may exceed deployment request limits'],
        };
    }

    const missing = [
        ffmpegReady ? null : 'ffmpeg',
        ffprobeReady ? null : 'ffprobe',
    ].filter(Boolean);

    return {
        available: false,
        status: 'deployment_required',
        runtime,
        note: `${label} online processing requires ${missing.join(' and ')} on this deployment.`,
        limits: ['Online mode depends on server media binaries'],
    };
}

export function getToolboxRuntimeStatus() {
    return {
        tools: {
            'compress-audio': getMediaRuntimeStatus('Audio'),
            'convert-audio': getMediaRuntimeStatus('Audio'),
            'video-to-mp3': getMediaRuntimeStatus('Video to MP3'),
            'mp4-to-mp3': getMediaRuntimeStatus('MP4 to MP3'),
            'compress-video': getMediaRuntimeStatus('Video'),
            'convert-video': getMediaRuntimeStatus('Video'),
            'mp4-converter': getMediaRuntimeStatus('Video'),
            'video-to-gif': getMediaRuntimeStatus('Video to GIF'),
            'mov-to-mp4': getMediaRuntimeStatus('Video'),
            'epub-to-mobi': getEpubToMobiStatus(),
            'rar-to-zip': getRarToZipStatus(),
        },
    };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED',
        });
    }

    return res.status(200).json(getToolboxRuntimeStatus());
}
