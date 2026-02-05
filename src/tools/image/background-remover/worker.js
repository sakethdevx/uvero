/**
 * Background Remover Worker
 * Removes background from images using edge detection and color analysis
 */

self.onmessage = async function (e) {
    const { imageData, sensitivity, smoothEdges } = e.data;

    try {
        const { width, height } = imageData;
        const data = new Uint8ClampedArray(imageData.data);

        // Simple background removal algorithm
        // Find the dominant background color (usually corners)
        const backgroundColor = findBackgroundColor(data, width, height);

        // Remove pixels similar to background color
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate color difference
            const diff = Math.sqrt(
                Math.pow(r - backgroundColor.r, 2) +
                Math.pow(g - backgroundColor.g, 2) +
                Math.pow(b - backgroundColor.b, 2)
            );

            // If color is similar to background, make it transparent
            const threshold = sensitivity * 100; // 0-100 scale
            if (diff < threshold) {
                data[i + 3] = 0; // Make transparent
            } else if (smoothEdges && diff < threshold * 1.5) {
                // Smooth edges by reducing opacity
                const opacity = Math.min(255, ((diff - threshold) / (threshold * 0.5)) * 255);
                data[i + 3] = opacity;
            }
        }

        self.postMessage({
            success: true,
            imageData: {
                data: data,
                width: width,
                height: height
            }
        });

    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};

function findBackgroundColor(data, width, height) {
    // Sample corner pixels to find background color
    const samples = [];
    const sampleSize = 10;

    // Top-left corner
    for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
            const i = (y * width + x) * 4;
            samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    // Top-right corner
    for (let y = 0; y < sampleSize; y++) {
        for (let x = width - sampleSize; x < width; x++) {
            const i = (y * width + x) * 4;
            samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    // Bottom-left corner
    for (let y = height - sampleSize; y < height; y++) {
        for (let x = 0; x < sampleSize; x++) {
            const i = (y * width + x) * 4;
            samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    // Bottom-right corner
    for (let y = height - sampleSize; y < height; y++) {
        for (let x = width - sampleSize; x < width; x++) {
            const i = (y * width + x) * 4;
            samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    // Calculate average color
    let avgR = 0, avgG = 0, avgB = 0;
    samples.forEach(sample => {
        avgR += sample.r;
        avgG += sample.g;
        avgB += sample.b;
    });

    return {
        r: Math.round(avgR / samples.length),
        g: Math.round(avgG / samples.length),
        b: Math.round(avgB / samples.length)
    };
}
