/**
 * Tool Metadata
 * Provides metadata about tools for the toolbox.
 * Minimal implementation after consolidation.
 */



// No document converter hub
export const DOCUMENT_CONVERTER_ENTRIES = [];
export const DOCUMENT_CONVERTER_TOOL_IDS = [];

// No tools need online mode offline executor bridge
export const ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS = [];

// Tools requiring server runtime verification
export const RUNTIME_VERIFIED_TOOL_IDS = [
    'compress-audio',
    'convert-audio',
    'video-to-mp3',
    'mp4-to-mp3',
    'compress-video',
    'convert-video',
    'mp4-converter',
    'video-to-gif',
    'mov-to-mp4',
    'epub-to-mobi',
];

// No tools require shared metadata
export const TOOLS_REQUIRING_SHARED_METADATA = [];

// Tool-specific metadata overrides
const TOOL_METADATA = {
    'epub-to-mobi': {
        availability: 'deployment_required',
        availabilityNote: 'Requires a configured server-side MOBI conversion runtime on this deployment.',
        limits: [
            'Online mode only',
            'Requires KindleGen or ebook-convert on the server',
        ],
    },
    'rar-to-zip': {
        availability: 'limited',
        availabilityNote: 'Server extraction supports only the currently supported RAR subset.',
        limits: [
            'Single-volume RAR only',
            'No password-protected archives',
            'No split or multipart archives',
        ],
    },
};

/**
 * Get metadata for a tool ID
 */
export function getToolMetadata(toolId) {
    return {
        availability: 'ready',
        availabilityNote: '',
        limits: [],

        ...(TOOL_METADATA[toolId] || {}),
    };
}

export function getDocumentConverterEntries() {
    return DOCUMENT_CONVERTER_ENTRIES.map((entry) => ({ ...entry }));
}

export function requiresRuntimeVerification(toolId) {
    return RUNTIME_VERIFIED_TOOL_IDS.includes(toolId);
}

export function usesOfflineExecutorInOnlineMode(toolId) {
    return ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS.includes(toolId);
}


export function getToolAvailabilityBadge(tool) {
    if (tool.availability === 'deployment_required') {
        return {
            label: 'Setup Required',
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        };
    }
    if (tool.availability === 'limited') {
        return {
            label: 'Limited',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
        };
    }
    if (tool.limits?.includes('Hub page only')) {
        return {
            label: 'Hub',
            className: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
        };
    }
    return null;
}
