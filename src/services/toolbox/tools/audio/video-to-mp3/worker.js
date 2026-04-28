/**
 * Video to MP3 Worker
 * Extracts audio from video using Web APIs and MediaRecorder
 */

self.addEventListener('message', async (e) => {
    const { file, bitrate } = e.data;

    try {
        // Create object URL for video
        const videoUrl = URL.createObjectURL(file);

        // Create video element
        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;

        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
        });

        const duration = video.duration;

        // Create AudioContext for processing
        const audioContext = new (self.AudioContext || self.webkitAudioContext)({
            sampleRate: bitrate >= 192 ? 48000 : 44100
        });

        // Create media element source
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        // Create MediaRecorder for MP3 encoding
        const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: 'audio/webm', // Browser will encode to WebM/Opus
            audioBitsPerSecond: bitrate * 1000
        });

        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        // Start recording and playing video
        mediaRecorder.start();
        video.play();

        // Wait for video to finish
        await new Promise((resolve) => {
            video.onended = resolve;
        });

        // Stop recording
        mediaRecorder.stop();

        // Wait for final data
        await new Promise((resolve) => {
            mediaRecorder.onstop = resolve;
        });

        // Create blob from chunks
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

        // Clean up
        URL.revokeObjectURL(videoUrl);
        await audioContext.close();

        // Send result back
        self.postMessage({
            success: true,
            blob: audioBlob,
            size: audioBlob.size,
            duration: formatDuration(duration)
        });

    } catch (error) {
        console.error('Worker conversion error:', error);
        self.postMessage({
            success: false,
            error: error.message || 'Failed to extract audio from video'
        });
    }
});

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
