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
 * Validate page ranges for extraction operations
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges to validate
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {string|null} Error message if validation fails, null if valid
 */
export function validatePageRangesForExtraction(ranges, totalPages) {
  if (ranges.length === 0) {
    return 'At least one page range is required for extraction.';
  }

  // Check for valid range values and overlaps
  const allPages = [];
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

    // Collect pages and check for duplicates within selection
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
 * Get the list of zero-based page indices to extract based on ranges
 * @param {Array<{start: number, end: number}>} ranges - Array of page ranges (1-indexed, inclusive)
 * @returns {Array<number>} Array of zero-based page indices to extract
 */
export function getPagesToExtract(ranges) {
  const pages = [];
  for (const range of ranges) {
    for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
      pages.push(pageNum - 1); // convert to 0-based index
    }
  }
  return pages;
}

/**
 * Generate a filename for the extracted PDF
 * @param {string} originalName - Original filename
 * @returns {string} Generated filename
 */
export function generateExtractFilename(originalName) {
  const getFileNameWithoutExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return filename;
    return filename.slice(0, lastDot);
  };

  const baseName = getFileNameWithoutExtension(originalName);
  return `${baseName}_extracted.pdf`;
}