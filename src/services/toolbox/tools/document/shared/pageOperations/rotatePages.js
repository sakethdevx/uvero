/**
 * Apply rotation to specific pages in a PDF
 * @param {Object} pdfDoc - The PDF document object from pdf-lib
 * @param {Array<number>} pageIndices - Zero-based page indices to rotate
 * @param {number} rotation - Rotation in degrees (90, 180, 270)
 * @param {Object} pdfLib - The pdf-lib instance
 */
export function applyPageRotation(pdfDoc, pageIndices, rotation, pdfLib) {
    // Normalize rotation to be within 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    // Only apply rotations that are multiples of 90
    if (normalizedRotation % 90 !== 0) {
        throw new Error('Rotation must be a multiple of 90 degrees');
    }
    
    // Apply rotation to each specified page using pdf-lib's degrees helper
    for (const pageIndex of pageIndices) {
        const page = pdfDoc.getPage(pageIndex);
        page.setRotation(pdfLib.degrees(normalizedRotation));
    }
}

/**
 * Validate page ranges for rotation operations
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges to validate
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validatePageRangesForRotation(ranges, totalPages) {
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];

        // Check for valid range values
        if (range.start < 1) {
            return `Range ${i + 1}: Start page must be at least 1.`;
        }

        if (range.end < range.start) {
            return `Range ${i + 1}: End page (${range.end}) cannot be less than start page (${range.start}).`;
        }

        if (range.end > totalPages) {
            return `Range ${i + 1}: End page (${range.end}) exceeds total pages (${totalPages}).`;
        }

        if (range.start > totalPages) {
            return `Range ${i + 1}: Start page (${range.start}) exceeds total pages (${totalPages}).`;
        }
    }

    // Check for overlaps and duplicates
    const allPages = [];
    for (const range of ranges) {
        for (let page = range.start; page <= range.end; page++) {
            if (allPages.includes(page)) {
                return `Page ${page} is duplicated in the selection.`;
            }
            allPages.push(page);
        }
    }

    return null;
}

/**
 * Create page ranges from a comma-separated string
 * @param {string} rangeString - The range string to parse (e.g., "1-3,5,7-10")
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {Array<{start: number, end: number}>} Array of page ranges (1-indexed, inclusive)
 */
export function parsePageRanges(rangeString, totalPages) {
    const ranges = [];
    const parts = rangeString.split(',').map(s => s.trim()).filter(s => s.length > 0);

    for (const part of parts) {
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-').map(s => s.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);

            if (!isNaN(start) && !isNaN(end)) {
                ranges.push({ start, end });
            }
        } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum)) {
                ranges.push({ start: pageNum, end: pageNum });
            }
        }
    }

    return ranges;
}

/**
 * Validate rotation value
 * @param {number} rotation - Rotation value in degrees
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validateRotation(rotation) {
    if (isNaN(rotation)) {
        return 'Rotation must be a valid number';
    }
    
    if (rotation % 90 !== 0) {
        return 'Rotation must be a multiple of 90 degrees (90, 180, 270, etc.)';
    }
    
    return null;
}