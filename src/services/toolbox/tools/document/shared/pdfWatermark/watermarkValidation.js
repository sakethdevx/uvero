import { WATERMARK_POSITIONS } from './watermarkConstants';
import { parsePageRanges } from '../pageOperations/pageSelectionUtils';

export const validateWatermarkOptions = (options, totalPages) => {
    if (!options.text || options.text.trim() === '') {
        return 'Watermark text is required.';
    }

    if (options.opacity < 0 || options.opacity > 1) {
        return 'Opacity must be between 0 and 1.';
    }

    if (options.fontSize <= 0) {
        return 'Font size must be greater than 0.';
    }

    if (!Object.values(WATERMARK_POSITIONS).includes(options.position)) {
        return 'Invalid watermark position.';
    }

    if (options.pages !== 'all') {
        const ranges = parsePageRanges(options.pages, totalPages);
        if (ranges.length === 0) {
            return 'Invalid page range format.';
        }
        for (const r of ranges) {
            if (r.start < 1 || r.end > totalPages || r.start > r.end) {
                return `Page range ${r.start}-${r.end} is out of bounds (1-${totalPages}).`;
            }
        }
    }

    return null;
};
