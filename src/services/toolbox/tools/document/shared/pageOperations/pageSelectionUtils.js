/**
 * Parse a page range string into PageRange objects
 * Supports formats like: "1-5", "1,3,5", "1-3,5,7-10"
 * @param {string} rangeString - The range string to parse
 * @param {number} totalPages - Total number of pages in the PDF (used for future range expansion)
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
