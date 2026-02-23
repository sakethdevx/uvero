/**
 * Video to MP3 Conversion Processor
 * Handles audio extraction from video files
 */

class VideoToMP3Processor {
    constructor() {
        // No longer using Web Worker since we need DOM access
    }

    /**
     * Convert video to MP3 (offline mode - client-side)
     * @param {File} file - The video file
     * @param {number} bitrate - Target MP3 bitrate in kbps
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convert(file, bitrate, onProgress) {
        try {
            if (onProgress) onProgress(10);

            // Create object URL for video
            const videoUrl = URL.createObjectURL(file);

            // Create video element
            const video = document.createElement('video');
            video.src = videoUrl;
            video.muted = true;

            // Wait for video metadata to load
            await new Promise((resolveLoad, rejectLoad) => {
                video.onloadedmetadata = resolveLoad;
                video.onerror = rejectLoad;
                video.load();
            });

            if (onProgress) onProgress(20);

            const duration = video.duration;

            // Create AudioContext for processing
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: bitrate >= 192 ? 48000 : 44100
            });

            // Create media element source
            const source = audioContext.createMediaElementSource(video);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);

            if (onProgress) onProgress(30);

            // Create MediaRecorder for audio encoding
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

            if (onProgress) onProgress(40);

            // Start recording and playing video
            mediaRecorder.start();
            video.play();

            if (onProgress) onProgress(50);

            // Update progress during playback
            const progressInterval = setInterval(() => {
                if (video.currentTime > 0 && video.duration > 0) {
                    const playbackProgress = (video.currentTime / video.duration) * 40; // 40% of progress
                    if (onProgress) onProgress(50 + playbackProgress);
                }
            }, 500);

            // Wait for video to finish
            await new Promise((resolveEnd) => {
                video.onended = resolveEnd;
            });

            clearInterval(progressInterval);
            if (onProgress) onProgress(90);

            // Stop recording
            mediaRecorder.stop();

            // Wait for final data
            await new Promise((resolveStop) => {
                mediaRecorder.onstop = resolveStop;
            });

            // Create blob from chunks
            const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

            // Clean up
            URL.revokeObjectURL(videoUrl);
            await audioContext.close();

            if (onProgress) onProgress(100);

            // Create a new File object from the blob
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}.mp3`;
            const convertedFile = new File([audioBlob], newFileName, { type: 'audio/mpeg' });

            // Format duration
            const mins = Math.floor(duration / 60);
            const secs = Math.floor(duration % 60);
            const formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

            return {
                file: convertedFile,
                blob: audioBlob,
                size: audioBlob.size,
                duration: formattedDuration
            };

        } catch (error) {
            console.error('Offline conversion error:', error);
            throw new Error(error.message || 'Failed to extract audio from video');
        }
    }

    /**
     * Convert video to MP3 (online mode - server-side)
     * @param {File} file - The video file
     * @param {number} bitrate - Target MP3 bitrate in kbps
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convertOnline(file, bitrate, onProgress) {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('video', file);
            formData.append('bitrate', bitrate.toString());

            if (onProgress) onProgress(20);

            // Upload to our serverless API
            const response = await fetch('/api/convert-video-to-mp3', {
                method: 'POST',
                body: formData,
            });

            if (onProgress) onProgress(80);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Server conversion failed');
            }

            // Get metadata from headers
            const size = parseInt(response.headers.get('X-Audio-Size') || 0);
            const duration = response.headers.get('X-Duration') || 'N/A';

            // Get the MP3 audio as blob
            const blob = await response.blob();

            if (onProgress) onProgress(100);

            // Create a new File object
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}.mp3`;
            const convertedFile = new File([blob], newFileName, { type: 'audio/mpeg' });

            return {
                file: convertedFile,
                blob,
                size,
                duration
            };
        } catch (error) {
            console.error('Online conversion failed:', error);
            throw new Error('Server conversion unavailable. ' + error.message);
        }
    }
}

export default new VideoToMP3Processor();
