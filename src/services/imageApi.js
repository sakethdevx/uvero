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
 * Compress image using server-side API
 * Uploads to /api/compress endpoint for processing with Sharp
 */
export async function compressImageOnline(file, quality) {
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('quality', quality.toString());

        // Upload to our serverless API
        const response = await fetch('/api/compress', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Server compression failed');
        }

        // Get compression stats from headers
        const originalSize = parseInt(response.headers.get('X-Original-Size') || file.size);
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || 0);
        const reduction = parseInt(response.headers.get('X-Reduction') || 0);

        // Get the compressed image as blob
        const blob = await response.blob();

        return {
            blob,
            originalSize,
            compressedSize,
            reduction
        };
    } catch (error) {
        console.error('Online compression failed:', error);
        // Fallback to offline mode will be handled by the component
        throw new Error('Server compression unavailable. ' + error.message);
    }
}

/**
 * Convert image format using online API
 * Note: Most free APIs have rate limits
 */
export async function convertImageOnline() {
    // For now, fallback to client-side for conversion
    // Free conversion APIs typically require API keys
    throw new Error('Online image conversion requires API key. Use offline mode for free conversion.');
}

/**
 * Resize image using online API
 */
export async function resizeImageOnline() {
    // Most free resize APIs require signup
    // For true free processing, client-side is better
    throw new Error('Online image resizing requires API key. Use offline mode for free resizing.');
}

/**
 * Remove background using online API
 */
export async function removeBackgroundOnline() {
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
