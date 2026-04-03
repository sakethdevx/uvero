/**
 * Video Processing API Service
 * Uses free public APIs for online video processing
 */

/**
 * Compress video using online API
 */
export async function compressVideoOnline() {
    // Video processing is resource-intensive
    // Free APIs are rare and have strict limits
    throw new Error('Online video compression requires API key. Use offline mode with FFmpeg.');
}

/**
 * Convert video format using online API
 */
export async function convertVideoOnline() {
    // CloudConvert supports video but requires API key
    throw new Error('Online video conversion requires API key. Use offline mode for free conversion.');
}

/**
 * Check if online processing is available for a feature
 */
export function isOnlineFeatureAvailable() {
    return false;
}
