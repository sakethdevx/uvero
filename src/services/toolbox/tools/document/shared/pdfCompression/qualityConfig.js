/**
 * Compression quality levels and associated rendering settings
 * Quality determines both render resolution and JPEG compression strength.
 */
export const QUALITY_LEVELS = {
  low: {
    scale: 0.5,           // Render at 50% resolution
    jpegQuality: 0.5,     // JPEG quality 50%
    label: 'Low (Smaller file)',
    description: 'Maximum compression, suitable for documents where file size is critical.'
  },
  medium: {
    scale: 0.75,          // Render at 75% resolution
    jpegQuality: 0.7,     // JPEG quality 70%
    label: 'Medium (Balanced)',
    description: 'Good balance between file size and readability.'
  },
  high: {
    scale: 1.0,           // Render at full resolution
    jpegQuality: 0.85,    // JPEG quality 85%
    label: 'High (Better quality)',
    description: 'Minimal compression, preserves visual fidelity.'
  }
};

/**
 * Get compression settings for a given level.
 * @param {string} level - 'low', 'medium', or 'high'
 * @returns {object} Compression configuration
 */
export function getCompressionSettings(level) {
  const normalized = level?.toLowerCase();
  return QUALITY_LEVELS[normalized] || QUALITY_LEVELS.medium;
}
