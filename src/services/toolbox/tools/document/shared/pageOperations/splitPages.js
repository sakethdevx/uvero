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
 * Validate page ranges against total page count
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges to validate
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validatePageRanges(ranges, totalPages) {
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

  // Check for overlaps
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sortedRanges.length - 1; i++) {
    if (sortedRanges[i].end >= sortedRanges[i + 1].start) {
      return `Range ${i + 1} and ${i + 2} overlap or are adjacent.`;
    }
  }

  return null;
}

/**
 * Create ranges to split every N pages
 * @param {number} totalPages - Total number of pages in the PDF
 * @param {number} n - Split every n pages
 * @returns {Array<{start: number, end: number}>} Array of page ranges (1-indexed, inclusive)
 */
export function createSplitEveryNPages(totalPages, n) {
  const ranges = [];
  if (n <= 0) {
    return [{ start: 1, end: totalPages }];
  }

  for (let start = 1; start <= totalPages; start += n) {
    const end = Math.min(start + n - 1, totalPages);
    ranges.push({ start, end });
  }

  return ranges;
}

/**
 * Create ranges to split into individual pages
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {Array<{start: number, end: number}>} Array of page ranges (1-indexed, inclusive)
 */
export function createSplitEveryPage(totalPages) {
  return createSplitEveryNPages(totalPages, 1);
}

/**
 * Generate a filename for a split PDF
 * @param {string} originalName - Original filename
 * @param {{start: number, end: number}} range - Page range for this split
 * @param {number} rangeIndex - Index of this range (1-based)
 * @param {number} totalRanges - Total number of ranges
 * @returns {string} Generated filename
 */
export function generateSplitFilename(originalName, range, rangeIndex, totalRanges) {
  const getFileNameWithoutExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return filename;
    return filename.slice(0, lastDot);
  };

  const baseName = getFileNameWithoutExtension(originalName);

  if (totalRanges === 1) {
    if (range.start === range.end) {
      return `${baseName}_page_${range.start}.pdf`;
    }
    return `${baseName}_pages_${range.start}-${range.end}.pdf`;
  }

  if (range.start === range.end) {
    return `${baseName}_part${rangeIndex}_page_${range.start}.pdf`;
  }
  return `${baseName}_part${rangeIndex}_pages_${range.start}-${range.end}.pdf`;
}