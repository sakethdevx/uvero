import lamejs from 'lamejs';
import {
    aggregateProgress,
    ensureFiles,
    normalizeMultiFileResult,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

function float32ToInt16(buffer) {
    const length = buffer.length;
    const pcm = new Int16Array(length);

    for (let i = 0; i < length; i += 1) {
        const sample = Math.max(-1, Math.min(1, buffer[i]));
        pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    return pcm;
}

export async function convertFile(file, bitrate, onProgress) {
    if (onProgress) onProgress(5);
    const arrayBuffer = await file.arrayBuffer();

    if (onProgress) onProgress(15);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    if (onProgress) onProgress(30);
    const channels = Math.min(audioBuffer.numberOfChannels, 2);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
    const leftPCM = float32ToInt16(leftChannel);
    const rightPCM = channels > 1 ? float32ToInt16(rightChannel) : leftPCM;

    if (onProgress) onProgress(50);
    const encoder = new lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, bitrate);
    const mp3Data = [];
    const sampleBlockSize = 1152;

    for (let i = 0; i < leftPCM.length; i += sampleBlockSize) {
        const leftChunk = leftPCM.subarray(i, i + sampleBlockSize);
        const rightChunk = channels > 1 ? rightPCM.subarray(i, i + sampleBlockSize) : leftChunk;
        const encodedChunk = encoder.encodeBuffer(leftChunk, rightChunk);

        if (encodedChunk.length > 0) {
            mp3Data.push(encodedChunk);
        }

        if (i % (sampleBlockSize * 20) === 0 && onProgress) {
            onProgress(Math.round(50 + (i / leftPCM.length) * 40));
        }
    }

    const flushChunk = encoder.flush();
    if (flushChunk.length > 0) {
        mp3Data.push(flushChunk);
    }

    const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
    const outputFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.mp3`, { type: 'audio/mpeg' });
    const mins = Math.floor(audioBuffer.duration / 60);
    const secs = Math.floor(audioBuffer.duration % 60);

    if (onProgress) onProgress(100);

    return {
        file: outputFile,
        size: blob.size,
        duration: `${mins}:${secs.toString().padStart(2, '0')}`,
    };
}

export async function run({ files, options = {}, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const bitrate = options.bitrate ?? 192;
    const outputFiles = [];
    const items = [];

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const result = await convertFile(sourceFiles[index], bitrate, aggregateProgress(onProgress, index, sourceFiles.length));
        outputFiles.push(result.file);
        items.push({
            outputSize: result.size,
            duration: result.duration,
        });
    }

    if (outputFiles.length === 1) {
        return normalizeSingleFileResult(outputFiles[0], items[0]);
    }

    return normalizeMultiFileResult(outputFiles, { items });
}
