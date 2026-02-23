/**
 * Audio Compression Worker
 * Handles audio compression using lamejs
 */

import lamejs from 'lamejs';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, bitrate } = e.data;

    if (type !== 'compress') {
        return;
    }

    try {
        // Decode audio data
        const audioContext = new OfflineAudioContext(2, 1, 44100);
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio properties
        const sampleRate = audioBuffer.sampleRate;
        const channels = audioBuffer.numberOfChannels;
        const samples = audioBuffer.length;

        // Extract audio data
        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

        // Convert to 16-bit PCM
        const leftPCM = convertFloat32ToInt16(leftChannel);
        const rightPCM = channels > 1 ? convertFloat32ToInt16(rightChannel) : leftPCM;

        // Initialize MP3 encoder
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
        const mp3Data = [];

        // Encode in chunks
        const chunkSize = 1152; // Standard MP3 frame size
        for (let i = 0; i < samples; i += chunkSize) {
            const leftChunk = leftPCM.subarray(i, i + chunkSize);
            const rightChunk = channels > 1 ? rightPCM.subarray(i, i + chunkSize) : leftChunk;

            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Flush remaining data
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        // Create blob from MP3 data
        const blob = new Blob(mp3Data, { type: 'audio/mpeg' });

        self.postMessage({
            type: 'success',
            data: blob
        });
    } catch (error) {
        console.error('Audio compression error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to compress audio'
        });
    }
});

/**
 * Convert Float32Array to Int16Array for PCM encoding
 */
function convertFloat32ToInt16(buffer) {
    const l = buffer.length;
    const buf = new Int16Array(l);

    for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, buffer[i]));
        buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return buf;
}
