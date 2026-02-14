/**
 * Audio Processing API Service
 * Uses free public APIs for online audio processing
 */

/**
 * Compress audio using online API
 */
export async function compressAudioOnline() {
    // Most audio APIs require authentication
    throw new Error('Online audio compression requires API key. Use offline mode for free compression.');
}

/**
 * Convert audio format using online API
 */
export async function convertAudioOnline() {
    // CloudConvert supports audio but requires API key
    throw new Error('Online audio conversion requires API key. Use offline mode for free conversion.');
}

/**
 * Check if online processing is available for a feature
 */
export function isOnlineFeatureAvailable() {
    return false;
}
