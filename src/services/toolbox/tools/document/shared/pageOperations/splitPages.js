import { getFileNameWithoutExtension } from '../pdfUtils';
import { parsePageRanges } from './pageSelectionUtils';

// Re-export for backward compatibility with engines that import from this module
export { parsePageRanges };

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