/**
 * Video to MP3 Conversion Processor
 * Handles audio extraction from video files using Web Audio API + lamejs
 */

import lamejs from 'lamejs';

class VideoToMP3Processor {
    constructor() {
        // No Web Worker needed - uses main thread AudioContext for decoding
    }

    /**
     * Convert video to MP3 (offline mode - client-side)
     * Uses OfflineAudioContext to decode audio, then encodes with lamejs
     * @param {File} file - The video file
     * @param {number} bitrate - Target MP3 bitrate in kbps
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Converted file result
     */
    async convert(file, bitrate, onProgress) {
        try {
            if (onProgress) onProgress(5);

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            if (onProgress) onProgress(15);

            // Decode audio data using AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            await audioContext.close();

            if (onProgress) onProgress(30);

            const duration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;
            const channels = Math.min(audioBuffer.numberOfChannels, 2); // Max stereo

            // Get audio channel data
            const leftChannel = audioBuffer.getChannelData(0);
            const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

            if (onProgress) onProgress(40);

            // Convert float32 to int16 PCM
            const leftPCM = this._float32ToInt16(leftChannel);
            const rightPCM = channels > 1 ? this._float32ToInt16(rightChannel) : leftPCM;

            if (onProgress) onProgress(50);

            // Encode to MP3 using lamejs
            const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
            const mp3Data = [];
            const sampleBlockSize = 1152; // Standard MP3 frame size
            const totalSamples = leftPCM.length;

            for (let i = 0; i < totalSamples; i += sampleBlockSize) {
                const leftChunk = leftPCM.subarray(i, i + sampleBlockSize);
                const rightChunk = channels > 1
                    ? rightPCM.subarray(i, i + sampleBlockSize)
                    : leftChunk;

                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }

                // Update progress (50% to 90% during encoding)
                if (i % (sampleBlockSize * 20) === 0 && onProgress) {
                    const encodeProgress = 50 + (i / totalSamples) * 40;
                    onProgress(Math.round(encodeProgress));
                }
            }

            // Flush remaining data
            const mp3buf = mp3encoder.flush();
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }

            if (onProgress) onProgress(95);

            // Create MP3 blob
            const audioBlob = new Blob(mp3Data, { type: 'audio/mpeg' });

            if (onProgress) onProgress(100);

            // Create result
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

    /**
     * Convert Float32Array to Int16Array for PCM encoding
     */
    _float32ToInt16(buffer) {
        const l = buffer.length;
        const buf = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            const s = Math.max(-1, Math.min(1, buffer[i]));
            buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buf;
    }
}

export default new VideoToMP3Processor();
