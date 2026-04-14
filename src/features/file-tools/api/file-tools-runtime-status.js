import fs from 'fs';
import path from 'path';
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

export function getFileToolsRuntimeStatus() {
    return {
        tools: {
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

    return res.status(200).json(getFileToolsRuntimeStatus());
}
