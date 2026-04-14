export const QUICK_CONVERTER_ELIGIBLE_TOOL_IDS = [
    'compress-image',
    'convert-image',
    'resize-image',
    'crop-image',
    'watermark',
    'remove-background',
    'image-to-pdf',
    'heic-to-jpg',
    'compress-pdf',
    'pdf-to-jpg',
    'video-to-mp3',
];

const TOOL_METADATA = {
    'document-converter': {
        availability: 'ready',
        availabilityNote: 'Browse document and ebook tools from one hub page. Individual tools may be offline, online, or deployment-backed.',
        limits: ['Hub page only'],
    },
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

export function getToolMetadata(toolId) {
    return {
        availability: 'ready',
        availabilityNote: '',
        limits: [],
        quickConverterEligible: QUICK_CONVERTER_ELIGIBLE_TOOL_IDS.includes(toolId),
        ...TOOL_METADATA[toolId],
    };
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
