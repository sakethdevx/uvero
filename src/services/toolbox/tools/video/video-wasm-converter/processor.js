import { FFmpeg } from '@ffmpeg/ffmpeg';

class VideoWasmConverterProcessor {
    constructor() {
        this.ffmpegInstances = new Map();
    }

    isAudioOutput(outputExt) {
        const audioExts = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.opus', '.wma'];
        return audioExts.includes(outputExt);
    }

    // eslint-disable-next-line no-unused-vars
    async convert(file, outputFormat, quality = null, onProgress = null) {
        // ... quality is kept as optional arg for unified processor API uniformity
        let outputExt = outputFormat.toLowerCase();
        if (!outputExt.startsWith('.')) outputExt = `.${outputExt}`;

        const isAudio = this.isAudioOutput(outputExt);

        const ffmpeg = new FFmpeg();
        const id = Math.random().toString(36).substr(2, 9);
        this.ffmpegInstances.set(id, ffmpeg);

        try {
            if (onProgress) {
                ffmpeg.on('progress', ({ progress }) => {
                    // scale progress 0 to 100
                    let percent = Math.round(progress * 100);
                    // Prevent it from reporting 100% repeatedly or staying stuck
                    if (percent > 100) percent = 100;
                    onProgress(percent);
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
            const command = await this.buildConversionCommand(file.name, outputExt, isAudio, quality);

            // Execute FFmpeg
            await ffmpeg.exec(command);

            // Read output from virtual FS
            const outputData = await ffmpeg.readFile('output' + outputExt);

            // Clean up
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);

            const inputBaseName = file.name.split('.').slice(0, -1).join('.');
            const outputFileName = inputBaseName + outputExt;

            const mimeType = isAudio ? 'audio/' + outputExt.replace('.', '') : 'video/' + outputExt.replace('.', '');
            const blob = new Blob([outputData.buffer], { type: mimeType });

            return {
                file: new File([blob], outputFileName, { type: blob.type })
            };
        } catch (error) {
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);
            throw error;
        }
    }

    getCodecs(ext) {
        switch (ext) {
            case ".mp4":
            case ".mkv":
            case ".mov":
            case ".mts":
            case ".ts":
            case ".m2ts":
            case ".flv":
            case ".f4v":
            case ".m4v":
            case ".3gp":
            case ".3g2":
                return { video: "libx264", audio: "aac" };
            case ".wmv":
                return { video: "wmv2", audio: "wmav2" };
            case ".webm":
            case ".ogv":
                return {
                    video: ext === ".webm" ? "libvpx" : "libtheora",
                    audio: "libvorbis",
                };
            case ".avi":
            case ".divx":
                return { video: "mpeg4", audio: "libmp3lame" };
            case ".mpg":
            case ".mpeg":
            case ".vob":
                return { video: "mpeg2video", audio: "mp2" };
            case ".mxf":
                return { video: "mpeg2video", audio: "pcm_s16le" };
            case ".gif":
                return { video: "gif", audio: null };
            default:
                return { video: "libx264", audio: "aac" };
        }
    }

    getToArgs(ext) {
        const codecs = this.getCodecs(ext);
        const args = ["-c:v", codecs.video];

        switch (codecs.video) {
            case "libx264": {
                args.push(
                    "-preset", "ultrafast",
                    "-crf", "23"
                );
                break;
            }
            case "mpeg2video": {
                if (ext === ".mxf") args.push("-ar", "48000");
                break;
            }
        }

        if (codecs.audio) {
            args.push("-c:a", codecs.audio);
            if (codecs.audio === "aac") args.push("-strict", "experimental");
        }

        return args;
    }

    async buildConversionCommand(inputName, outputExt, isAudio, quality) {
        let extraArgs = [];

        if (isAudio) {
            // Audio extraction: -vn disables video recording
            extraArgs.push('-vn');

            // Set audio codec based on output format
            const audioCodec = this.getAudioCodec(outputExt);
            if (audioCodec) {
                extraArgs.push('-c:a', audioCodec);
                if (audioCodec === 'aac' || audioCodec === 'libfdk_aac') {
                    extraArgs.push('-strict', 'experimental');
                }
            }

            // Quality/bitrate handling
            if (quality && typeof quality === 'string' && quality !== 'auto') {
                extraArgs.push('-b:a', quality);
            } else {
                // Default bitrate for lossy audio
                extraArgs.push('-b:a', '128k');
            }
        } else {
            // Video conversion (existing logic)
            extraArgs = this.getToArgs(outputExt);
            // Apply quality if provided
            if (quality && typeof quality === 'string' && quality !== 'auto') {
                extraArgs.push('-b:v', quality);
            }
        }

        return [
            '-i', 'input',
            ...extraArgs,
            'output' + outputExt
        ];
    }

    getAudioCodec(ext) {
        switch (ext) {
            case '.mp3': return 'libmp3lame';
            case '.wav': return 'pcm_s16le';
            case '.flac': return 'flac';
            case '.ogg': return 'libvorbis';
            case '.aac': return 'aac';
            case '.m4a': return 'aac';
            case '.opus': return 'libopus';
            case '.wma': return 'wmav2';
            default: return 'aac';
        }
    }
}

export default new VideoWasmConverterProcessor();