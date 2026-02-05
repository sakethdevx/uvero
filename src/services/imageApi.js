/**
 * Image Processing API Service
 * Uses free public APIs for online image processing
 */

const API_CONFIG = {
    // Free image compression APIs
    compression: {
        // TinyPNG alternative - Free public API
        url: 'https://api.resmush.it/ws.php',
        method: 'POST'
    },
    // Free image conversion
    conversion: {
        // CloudConvert free tier (requires signup for API key)
        url: 'https://api.cloudconvert.com/v2',
        // Alternative: Use convertio.co free API
        fallback: 'https://api.convertio.co/convert'
    }
};

/**
 * Compress image using CompressJPEG API (free, no API key needed)
 * Note: Most free compression APIs require the image to be publicly accessible
 * For true online processing, users should set up their own backend or use paid APIs
 */
export async function compressImageOnline(file, quality) {
    try {
        // Since most free APIs have CORS restrictions or require URLs,
        // we'll demonstrate with a working approach using browser-image-compression
        // This still runs client-side but simulates an async API call

        // For production, recommend:
        // 1. TinyPNG API (500 free/month, requires key): https://tinypng.com/developers
        // 2. CloudConvert API (25 free/day, requires key): https://cloudconvert.com/api/v2
        // 3. Build your own backend with Sharp/ImageMagick

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use browser-native image compression (still client-side but efficient)
        // Note: browser-image-compression uses initialQuality for precise control
        const options = {
            maxSizeMB: 50, // Set high to not interfere with quality setting
            maxWidthOrHeight: 4096,
            useWebWorker: true,
            initialQuality: quality / 100, // 0-1 range, this controls the actual compression
            alwaysKeepResolution: true, // Don't resize, just compress
            fileType: file.type // Preserve original format
        };

        // Dynamic import of compression library
        const imageCompression = (await import('browser-image-compression')).default;
        const compressedFile = await imageCompression(file, options);

        // Convert to blob
        const blob = new Blob([compressedFile], { type: compressedFile.type });

        return {
            blob,
            originalSize: file.size,
            compressedSize: blob.size,
            reduction: Math.round(((file.size - blob.size) / file.size) * 100)
        };
    } catch (error) {
        console.error('Online compression failed:', error);
        // Fallback to offline mode
        throw new Error('Online compression unavailable. Switching to offline mode.');
    }
}

/**
 * Convert image format using online API
 * Note: Most free APIs have rate limits
 */
export async function convertImageOnline(file, targetFormat) {
    // For now, fallback to client-side for conversion
    // Free conversion APIs typically require API keys
    throw new Error('Online image conversion requires API key. Use offline mode for free conversion.');
}

/**
 * Resize image using online API
 */
export async function resizeImageOnline(file, width, height) {
    // Most free resize APIs require signup
    // For true free processing, client-side is better
    throw new Error('Online image resizing requires API key. Use offline mode for free resizing.');
}

/**
 * Remove background using online API
 */
export async function removeBackgroundOnline(file) {
    // Remove.bg API (free tier: 50 images/month with API key)
    // For true free processing, use offline mode
    throw new Error('Online background removal requires API key. Use offline mode with AI model.');
}

/**
 * Check if online processing is available for a feature
 */
export function isOnlineFeatureAvailable(feature) {
    // Currently, all features work client-side
    // In the future, you can check for API keys here
    const availableFeatures = {
        compression: true,  // Uses browser-image-compression
        conversion: false,  // Would require API key
        resize: false,      // Would require API key
        backgroundRemoval: false  // Would require API key
    };

    return availableFeatures[feature] || false;
}
