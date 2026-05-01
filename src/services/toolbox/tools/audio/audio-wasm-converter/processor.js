import { FFmpeg } from '@ffmpeg/ffmpeg';

class AudioWasmConverterProcessor {
    constructor() {
        this.ffmpegInstances = new Map();
    }

    async convert(file, outputFormat, quality = null, onProgress = null) {
        let outputExt = outputFormat.toLowerCase();
        if (!outputExt.startsWith('.')) outputExt = `.${outputExt}`;

        // Alac requires m4a container
        const isAlac = outputExt === '.alac';
        if (isAlac) outputExt = '.m4a';

        const ffmpeg = new FFmpeg();
        const id = Math.random().toString(36).substr(2, 9);
        this.ffmpegInstances.set(id, ffmpeg);

        try {
            if (onProgress) {
                ffmpeg.on('progress', ({ progress }) => {
                    // scale progress 0 to 100
                    onProgress(progress * 100);
                });
            }

            const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
            await ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            });

            // Write input file to virtual FS
            const data = await file.arrayBuffer();
            await ffmpeg.writeFile('input', new Uint8Array(data));

            // Build Conversion command
            const command = await this.buildConversionCommand(ffmpeg, file.name, outputExt, isAlac, quality);

            // Execute FFmpeg
            await ffmpeg.exec(command);

            // Read output from virtual FS
            const outputData = await ffmpeg.readFile('output' + outputExt);

            // Clean up
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);

            const inputBaseName = file.name.split('.').slice(0, -1).join('.');
            const outputFileName = inputBaseName + outputExt;

            const blob = new Blob([outputData.buffer], { type: 'audio/' + outputExt.replace('.', '') });
            return {
                file: new File([blob], outputFileName, { type: blob.type })
            };
        } catch (error) {
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);
            throw error;
        }
    }

    async detectAudioBitrate(ffmpeg) {
        const args = [
            "-v", "quiet",
            "-select_streams", "a:0",
            "-show_entries", "stream=bit_rate",
            "-of", "default=noprint_wrappers=1:nokey=1",
            "input"
        ];

        let bitrate = null;
        return new Promise((resolve) => {
            const listener = ({ message }) => {
                if (bitrate !== null) return;
                const n = parseInt(message.trim(), 10);
                if (n && !isNaN(n)) {
                    bitrate = Math.round(n / 1000);
                }
            };
            ffmpeg.on('log', listener);

            ffmpeg.exec(args).then(() => {
                resolve(bitrate);
            }).catch(() => {
                resolve(null);
            }).finally(() => {
                ffmpeg.off('log', listener);
            });
        });
    }

    async buildConversionCommand(ffmpeg, inputName, outputExt, isAlac, quality) {
        const inputFormat = inputName.split('.').pop()?.toLowerCase() || '';
        const outputFormat = outputExt.slice(1);

        const lossless = [
            "flac", "m4a", "caf", "alac", "wav", "dsd", "dsf", "dff"
        ];

        const isLosslessToLossy = lossless.includes(inputFormat) && !lossless.includes(outputFormat);

        // Quality could be a bitrate string like '320k' or '128k'
        let audioBitrateArgs = [];

        if (quality && typeof quality === 'string' && quality !== 'auto') {
            audioBitrateArgs = ['-b:a', quality];
        } else {
            if (isLosslessToLossy) {
                audioBitrateArgs = ['-b:a', '128k'];
            } else {
                /*
                // Temporarily disable ffprobe reading here if it is complex 
                // in vanilla ffmpeg.wasm execution.
                const inputBitrate = await this.detectAudioBitrate(ffmpeg);
                if (inputBitrate) {
                    audioBitrateArgs = ['-b:a', `${inputBitrate}k`];
                }
                */
            }
        }

        let m4aArgs = [];
        if (isAlac) {
            m4aArgs = ['-acodec', 'alac'];
        } else if (outputFormat === 'm4a') {
            m4aArgs = ['-acodec', 'aac'];
        } else if (outputFormat === 'mp3') {
            if (!audioBitrateArgs.length) audioBitrateArgs = ['-q:a', '2'];
        }

        // Just basic conversion
        return [
            '-i', 'input',
            ...m4aArgs,
            ...audioBitrateArgs,
            'output' + outputExt
        ];
    }
}

export default new AudioWasmConverterProcessor();