export const PDF_IMAGE_FORMATS = {
    PNG: 'png',
    JPG: 'jpg',
    WEBP: 'webp',
};

export const PDF_IMAGE_MIME_TYPES = {
    [PDF_IMAGE_FORMATS.PNG]: 'image/png',
    [PDF_IMAGE_FORMATS.JPG]: 'image/jpeg',
    [PDF_IMAGE_FORMATS.WEBP]: 'image/webp',
};

export const PDF_IMAGE_EXTENSIONS = {
    [PDF_IMAGE_FORMATS.PNG]: 'png',
    [PDF_IMAGE_FORMATS.JPG]: 'jpg',
    [PDF_IMAGE_FORMATS.WEBP]: 'webp',
};

export const RENDER_QUALITY_PRESETS = {
    low: {
        label: 'Low',
        dpi: 96,
        scale: 96 / 72,
        imageQuality: 0.72,
        maxPixels: 12000000,
    },
    medium: {
        label: 'Medium',
        dpi: 144,
        scale: 2,
        imageQuality: 0.86,
        maxPixels: 24000000,
    },
    high: {
        label: 'High',
        dpi: 216,
        scale: 3,
        imageQuality: 0.92,
        maxPixels: 36000000,
    },
    'print-quality': {
        label: 'Print Quality',
        dpi: 300,
        scale: 300 / 72,
        imageQuality: 0.95,
        maxPixels: 52000000,
    },
};

export const DEFAULT_PDF_TO_IMAGE_OPTIONS = {
    format: PDF_IMAGE_FORMATS.PNG,
    qualityPreset: 'medium',
    pageMode: 'all',
    pageRanges: '',
    backgroundColor: '#ffffff',
};

export const MAX_EXPORT_PAGES = 250;
export const MAX_RENDER_SCALE = 5;
