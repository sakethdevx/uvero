export const WATERMARK_POSITIONS = {
    CENTER: 'center',
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right'
};

export const WATERMARK_ROTATIONS = {
    NONE: 0,
    DIAGONAL: -45,
    VERTICAL: 90,
    VERTICAL_REV: -90
};

export const DEFAULT_WATERMARK_OPTIONS = {
    text: '',
    position: WATERMARK_POSITIONS.CENTER,
    opacity: 0.3,
    rotation: WATERMARK_ROTATIONS.DIAGONAL,
    fontSize: 48,
    color: { r: 128, g: 128, b: 128 },
    pages: 'all', // 'all' or range string like '1-3'
};
