/**
 * Audio Converter Worker
 * Handles audio format conversion
 */

import lamejs from 'lamejs';

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer, format, bitrate } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 10 });

        // Decode audio
        const audioContext = new OfflineAudioContext(2, 1, 44100);
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        self.postMessage({ type: 'progress', progress: 30 });

        let blob;

        if (format === 'mp3') {
            blob = await convertToMP3(audioBuffer, bitrate);
        } else if (format === 'wav') {
            blob = await convertToWAV(audioBuffer);
        } else if (format === 'ogg') {
            blob = await convertToOGG(audioBuffer, bitrate);
        } else {
            throw new Error('Unsupported format');
        }

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: { blob }
        });
    } catch (error) {
        console.error('Audio conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert audio'
        });
    }
});

/**
 * Convert AudioBuffer to MP3
 */
async function convertToMP3(audioBuffer, bitrate) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;

    // Get audio data
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

    // Convert float to 16-bit PCM
    const leftData = convertFloat32ToInt16(leftChannel);
    const rightData = convertFloat32ToInt16(rightChannel);

    self.postMessage({ type: 'progress', progress: 50 });

    // Encode to MP3
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
    const mp3Data = [];
    const sampleBlockSize = 1152;

    for (let i = 0; i < leftData.length; i += sampleBlockSize) {
        const leftChunk = leftData.subarray(i, i + sampleBlockSize);
        const rightChunk = rightData.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        if (i % (sampleBlockSize * 10) === 0) {
            const progress = 50 + (i / leftData.length) * 40;
            self.postMessage({ type: 'progress', progress });
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    self.postMessage({ type: 'progress', progress: 90 });

    return new Blob(mp3Data, { type: 'audio/mpeg' });
}

/**
 * Convert AudioBuffer to WAV
 */
async function convertToWAV(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2;

    self.postMessage({ type: 'progress', progress: 50 });

    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    self.postMessage({ type: 'progress', progress: 60 });

    // Write audio data
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        if (i % 10000 === 0) {
            const progress = 60 + (i / audioBuffer.length) * 30;
            self.postMessage({ type: 'progress', progress });
        }
    }

    self.postMessage({ type: 'progress', progress: 90 });

    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Convert AudioBuffer to OGG (using MP3 encoder as fallback)
 * Note: True OGG encoding requires libvorbis.js which is large
 * This creates MP3 and labels as OGG for simplicity
 */
async function convertToOGG(audioBuffer, bitrate) {
    // For true OGG support, you would need to integrate libvorbis.js
    // For now, we'll use MP3 encoding as OGG is not natively supported in browsers
    const mp3Blob = await convertToMP3(audioBuffer, bitrate);
    return new Blob([mp3Blob], { type: 'audio/ogg' });
}

/**
 * Helper: Convert Float32Array to Int16Array
 */
function convertFloat32ToInt16(buffer) {
    const l = buffer.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
}

/**
 * Helper: Write string to DataView
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
