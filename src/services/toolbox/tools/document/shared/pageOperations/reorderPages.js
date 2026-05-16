/**
 * Validate the new page order for reordering operations
 * @param {Array<number>} newOrder - Array of zero-based page indices representing the new order
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validateReorderPageOrder(newOrder, totalPages) {
    // Check if the length matches
    if (newOrder.length !== totalPages) {
        return `New order must contain exactly ${totalPages} pages.`;
    }

    // Create a boolean array to track which pages have been seen
    const seen = new Array(totalPages).fill(false);

    for (let i = 0; i < newOrder.length; i++) {
        const pageIndex = newOrder[i];

        // Check if the page index is within valid range
        if (pageIndex < 0 || pageIndex >= totalPages) {
            return `Page index at position ${i} (${pageIndex}) is out of bounds (0-${totalPages - 1}).`;
        }

        // Check for duplicates
        if (seen[pageIndex]) {
            return `Page index ${pageIndex} appears more than once in the new order.`;
        }

        seen[pageIndex] = true;
    }

    // Check for missing pages (though the duplicate and length checks should catch this, but for clarity)
    for (let i = 0; i < seen.length; i++) {
        if (!seen[i]) {
            return `Page index ${i} is missing from the new order.`;
        }
    }

    return null;
}

/**
 * Generate a filename for the reordered PDF
 * @param {string} originalName - Original filename
 * @returns {string} Generated filename
 */
export function generateReorderFilename(originalName) {
    const getFileNameWithoutExtension = (filename) => {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return filename;
        return filename.slice(0, lastDot);
    };

    const baseName = getFileNameWithoutExtension(originalName);
    return `${baseName}_reordered.pdf`;
}