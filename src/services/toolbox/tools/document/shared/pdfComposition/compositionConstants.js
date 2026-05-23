export const PAGE_SIZES = {
    A4: { width: 595.28, height: 841.89 },
    LETTER: { width: 612, height: 792 },
    LEGAL: { width: 612, height: 1008 },
    A3: { width: 841.89, height: 1190.55 },
    A5: { width: 419.53, height: 595.28 },
    FIT: { width: 0, height: 0 },
};

export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/heic',
];

export const SUPPORTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.heic'
];

export const ORIENTATIONS = {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape',
    AUTO: 'auto'
};

export const DEFAULT_COMPOSITION_OPTIONS = {
    pageSize: 'A4',
    orientation: ORIENTATIONS.AUTO,
    margin: 36, // 0.5 inch
    centerImage: true,
    scaleToFit: true,
};
