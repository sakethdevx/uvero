/**
 * Parse a page range string into PageRange objects
 * Supports formats like: "1-5", "1,3,5", "1-3,5,7-10"
 * @param {string} rangeString - The range string to parse
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
 * Validate page ranges for deletion operations
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges to validate
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validatePageRangesForDeletion(ranges, totalPages) {
  // Check for valid range values
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];

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

  // Check if we are trying to delete all pages
  if (allPages.length === totalPages) {
    return 'Cannot delete all pages. At least one page must remain.';
  }

  return null;
}

/**
 * Create an array of page indices to keep (zero-based) after deleting the specified ranges
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges to delete (1-indexed, inclusive)
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {Array<number>} Array of zero-based page indices to keep
 */
export function getPagesToKeep(ranges, totalPages) {
  // Create a boolean array indicating which pages to delete (zero-based index)
  const pagesToDelete = new Array(totalPages).fill(false);
  for (const range of ranges) {
    for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
      const zeroBasedIndex = pageNum - 1;
      if (zeroBasedIndex >= 0 && zeroBasedIndex < totalPages) {
        pagesToDelete[zeroBasedIndex] = true;
      }
    }
  }

  // Collect indices of pages to keep
  const pagesToKeep = [];
  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete[i]) {
      pagesToKeep.push(i);
    }
  }

  return pagesToKeep;
}

/**
 * Generate a filename for the deleted pages PDF
 * @param {string} originalName - Original filename
 * @returns {string} Generated filename
 */
export function generateDeleteFilename(originalName) {
  const getFileNameWithoutExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return filename;
    return filename.slice(0, lastDot);
  };

  const baseName = getFileNameWithoutExtension(originalName);
  return `${baseName}_deleted.pdf`;
}