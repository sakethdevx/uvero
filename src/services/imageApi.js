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
 * Compress image using reSmush.it API (free, no signup required)
 */
export async function compressImageOnline(file, quality) {
    try {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('qlty', Math.round(quality)); // 0-100

        const response = await fetch(API_CONFIG.compression.url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_long || 'Compression failed');
        }

        // Download the compressed image
        const compressedResponse = await fetch(data.dest);
        const blob = await compressedResponse.blob();

        return {
            blob,
            originalSize: data.src_size,
            compressedSize: data.dest_size,
            reduction: Math.round(((data.src_size - data.dest_size) / data.src_size) * 100)
        };
    } catch (error) {
        console.error('Online compression failed:', error);
        throw new Error('Online compression failed. Try offline mode or check your connection.');
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
    const availableFeatures = ['compression']; // Only compression is truly free without API key
    return availableFeatures.includes(feature);
}
